/*
Copyright 2025.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controller

import (
	"context"
	"fmt"
	"time"

	"k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	corev1alpha1 "github.com/pascal-sochacki/plattform/api/v1alpha1"
)

// Definitions to manage status conditions
const (
	// typeAvailableProject represents the status of the Deployment reconciliation
	typeAvailableProject = "Available"
	// typeDegradedProject represents the status used when the custom resource is deleted and the finalizer operations are yet to occur.
	typeDegradedProject = "Degraded"
)
const projectFinalizer = "core.plattf0rm.de/finalizer"

// ProjectReconciler reconciles a Project object
type ProjectReconciler struct {
	client.Client
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
}

// +kubebuilder:rbac:groups=core.plattf0rm.de,resources=projects,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.plattf0rm.de,resources=projects/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=core.plattf0rm.de,resources=projects/finalizers,verbs=update
// +kubebuilder:rbac:groups=core,resources=events,verbs=create;patch
// +kubebuilder:rbac:groups=core,resources=namespaces,verbs=get;list;watch;create;update;patch;delete

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the Project object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.18.4/pkg/reconcile
func (r *ProjectReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)
	project := &corev1alpha1.Project{}
	err := r.Get(ctx, req.NamespacedName, project)
	if err != nil {
		if apierrors.IsNotFound(err) {
			// If the custom resource is not found then it usually means that it was deleted or not created
			// In this way, we will stop the reconciliation
			log.Info("project resource not found. Ignoring since object must be deleted")
			return ctrl.Result{}, nil
		}
		// Error reading the object - requeue the request.
		log.Error(err, "Failed to get project")
		return ctrl.Result{}, err
	}

	// Let's just set the status as Unknown when no status is available
	if project.Status.Conditions == nil || len(project.Status.Conditions) == 0 {
		meta.SetStatusCondition(&project.Status.Conditions, metav1.Condition{Type: typeAvailableProject, Status: metav1.ConditionUnknown, Reason: "Reconciling", Message: "Starting reconciliation"})
		if err = r.Status().Update(ctx, project); err != nil {
			log.Error(err, "Failed to update Project status")
			return ctrl.Result{}, err
		}

		// Let's re-fetch the project Custom Resource after updating the status
		// so that we have the latest state of the resource on the cluster and we will avoid
		// raising the error "the object has been modified, please apply
		// your changes to the latest version and try again" which would re-trigger the reconciliation
		// if we try to update it again in the following operations
		if err := r.Get(ctx, req.NamespacedName, project); err != nil {
			log.Error(err, "Failed to re-fetch project")
			return ctrl.Result{}, err
		}
	}
	if !controllerutil.ContainsFinalizer(project, projectFinalizer) {
		log.Info("Adding Finalizer for Project")
		if ok := controllerutil.AddFinalizer(project, projectFinalizer); !ok {
			log.Error(err, "Failed to add finalizer into the custom resource")
			return ctrl.Result{Requeue: true}, nil
		}

		if err = r.Update(ctx, project); err != nil {
			log.Error(err, "Failed to update custom resource to add finalizer")
			return ctrl.Result{}, err
		}
	}
	// Check if the Project instance is marked to be deleted, which is
	// indicated by the deletion timestamp being set.
	isMemcachedMarkedToBeDeleted := project.GetDeletionTimestamp() != nil
	if isMemcachedMarkedToBeDeleted {
		if controllerutil.ContainsFinalizer(project, projectFinalizer) {
			log.Info("Performing Finalizer Operations for Project before delete CR")
			// Let's add here a status "Downgrade" to reflect that this resource began its process to be terminated.
			meta.SetStatusCondition(&project.Status.Conditions, metav1.Condition{Type: typeDegradedProject,
				Status: metav1.ConditionUnknown, Reason: "Finalizing",
				Message: fmt.Sprintf("Performing finalizer operations for the custom resource: %s ", project.Name)})

			if err := r.Status().Update(ctx, project); err != nil {
				log.Error(err, "Failed to update Project status")
				return ctrl.Result{}, err
			}
			// Perform all operations required before removing the finalizer and allow
			// the Kubernetes API to remove the custom resource.
			r.doFinalizerOperationsForProject(project)
			// TODO(user): If you add operations to the doFinalizerOperationsForMemcached method
			// then you need to ensure that all worked fine before deleting and updating the Downgrade status
			// otherwise, you should requeue here.

			// Re-fetch the project Custom Resource before updating the status
			// so that we have the latest state of the resource on the cluster and we will avoid
			// raising the error "the object has been modified, please apply
			// your changes to the latest version and try again" which would re-trigger the reconciliation
			if err := r.Get(ctx, req.NamespacedName, project); err != nil {
				log.Error(err, "Failed to re-fetch project")
				return ctrl.Result{}, err
			}
			meta.SetStatusCondition(&project.Status.Conditions, metav1.Condition{Type: typeDegradedProject,
				Status: metav1.ConditionTrue, Reason: "Finalizing",
				Message: fmt.Sprintf("Finalizer operations for custom resource %s name were successfully accomplished", project.Name)})

			if err := r.Status().Update(ctx, project); err != nil {
				log.Error(err, "Failed to update Project status")
				return ctrl.Result{}, err
			}

			log.Info("Removing Finalizer for Project after successfully perform the operations")
			if ok := controllerutil.RemoveFinalizer(project, projectFinalizer); !ok {
				log.Error(err, "Failed to remove finalizer for Project")
				return ctrl.Result{Requeue: true}, nil
			}

			if err := r.Update(ctx, project); err != nil {
				log.Error(err, "Failed to remove finalizer for Project")
				return ctrl.Result{}, err
			}

		}
		return ctrl.Result{}, nil
	}
	found := &v1.Namespace{}
	err = r.Get(ctx, types.NamespacedName{Name: project.Name, Namespace: project.Namespace}, found)
	if err != nil && apierrors.IsNotFound(err) {
		ns, err := r.NamepsaceForProject(project)
		if err != nil {
			log.Error(err, "Failed to define new Namespace resource for Project")

			// The following implementation will update the status
			meta.SetStatusCondition(&project.Status.Conditions, metav1.Condition{Type: typeAvailableProject,
				Status: metav1.ConditionFalse, Reason: "Reconciling",
				Message: fmt.Sprintf("Failed to create Namespace for the custom resource (%s): (%s)", project.Name, err)})

			if err := r.Status().Update(ctx, project); err != nil {
				log.Error(err, "Failed to update Project status")
				return ctrl.Result{}, err
			}

			return ctrl.Result{}, err
		}
		log.Info("Creating a new Namespace", "Deployment.Name", project.Name)
		if err = r.Create(ctx, ns); err != nil {
			log.Error(err, "Failed to create new Namespace", "Namespace.Name", ns.Name)
			return ctrl.Result{}, err
		}
		return ctrl.Result{RequeueAfter: time.Second * 10}, nil
	} else if err != nil {
		log.Error(err, "Failed to get Deployment")
		// Let's return the error for the reconciliation be re-trigged again
		return ctrl.Result{}, err
	}

	meta.SetStatusCondition(&project.Status.Conditions, metav1.Condition{Type: typeAvailableProject,
		Status: metav1.ConditionTrue, Reason: "Reconciling",
		Message: "Project created successfully"})

	if err := r.Status().Update(ctx, project); err != nil {
		log.Error(err, "Failed to update Project")
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}
func (r *ProjectReconciler) NamepsaceForProject(project *corev1alpha1.Project) (*v1.Namespace, error) {
	ls := labelsForProject()

	ns := &v1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name:   project.Name,
			Labels: ls,
		},
	}

	// Set the ownerRef for the Deployment
	// More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/
	if err := ctrl.SetControllerReference(project, ns, r.Scheme); err != nil {
		return nil, err
	}
	return ns, nil
}

// finalizeMemcached will perform the required operations before delete the CR.
func (r *ProjectReconciler) doFinalizerOperationsForProject(cr *corev1alpha1.Project) {
	log := log.FromContext(context.Background())
	// TODO(user): Add the cleanup steps that the operator
	// needs to do before the CR can be deleted. Examples
	// of finalizers include performing backups and deleting
	// resources that are not owned by this CR, like a PVC.

	// Note: It is not recommended to use finalizers with the purpose of deleting resources which are
	// created and managed in the reconciliation. These ones, such as the Deployment created on this reconcile,
	// are defined as dependent of the custom resource. See that we use the method ctrl.SetControllerReference.
	// to set the ownerRef which means that the Deployment will be deleted by the Kubernetes API.
	// More info: https://kubernetes.io/docs/tasks/administer-cluster/use-cascading-deletion/

	// The following implementation will raise an event
	message := fmt.Sprintf("Custom Resource %s is being deleted from the namespace %s", cr.Name, cr.Namespace)
	if r.Recorder == nil {
		log.Info("Recorder is nil")
	} else {
		r.Recorder.Event(cr, "Warning", "Deleting", message)
	}
}

// labelsForMemcached returns the labels for selecting the resources
// More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/
func labelsForProject() map[string]string {
	return map[string]string{
		"app.kubernetes.io/name":       "project-operator",
		"app.kubernetes.io/managed-by": "ProjectController",
	}
}

// SetupWithManager sets up the controller with the Manager.
func (r *ProjectReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Project{}).
		Owns(&v1.Namespace{}).
		Complete(r)
}
