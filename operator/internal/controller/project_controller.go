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

	pipeline "github.com/tektoncd/pipeline/pkg/apis/pipeline/v1"
	triggers "github.com/tektoncd/triggers/pkg/apis/triggers/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	corev1alpha1 "github.com/pascal-sochacki/plattform/api/v1alpha1"
)

// Definitions to manage status conditions
const (
	// typeAvailableProject represents the status of the Deployment reconciliation
	typeAvailableProject = "Available"
	// typeDegradedProject represents the status used when the custom resource is deleted and the finalizer operations are yet to occur.
	typeDegradedProject = "Degraded"
	typeErrorProject    = "Error"
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
// +kubebuilder:rbac:groups=core,resources=serviceaccounts,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=tekton.dev,resources=pipelines,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=tekton.dev,resources=task,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=tekton.dev,resources=eventlisteners,verbs=get;list;watch;create;update;patch;delete

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
		condition := metav1.Condition{
			Type:    typeDegradedProject,
			Status:  metav1.ConditionUnknown,
			Reason:  "Reconciling",
			Message: "Starting reconciliation",
		}

		if err = r.UpdateCondition(ctx, project, condition); err != nil {
			log.Error(err, "Failed to update Project status")
			return ctrl.Result{}, err
		}

		if err := r.Get(ctx, req.NamespacedName, project); err != nil {
			log.Error(err, "Failed to re-fetch project")
		}
	}

	if !controllerutil.ContainsFinalizer(project, projectFinalizer) {
		log.Info("Adding Finalizer for Project")
		if ok := controllerutil.AddFinalizer(project, projectFinalizer); !ok {
			log.Error(err, "Failed to add finalizer into the custom resource")
			return ctrl.Result{}, err
		}

		if err = r.Update(ctx, project); err != nil {
			log.Error(err, "Failed to update custom resource to add finalizer")
			return ctrl.Result{}, err
		}
		return ctrl.Result{}, nil
	}
	// Check if the Project instance is marked to be deleted, which is
	// indicated by the deletion timestamp being set.
	isMemcachedMarkedToBeDeleted := project.GetDeletionTimestamp() != nil
	if isMemcachedMarkedToBeDeleted {
		if controllerutil.ContainsFinalizer(project, projectFinalizer) {
			log.Info("Performing Finalizer Operations for Project before delete CR")
			// Let's add here a status "Downgrade" to reflect that this resource began its process to be terminated.
			condition := metav1.Condition{
				Type:    typeDegradedProject,
				Status:  metav1.ConditionUnknown,
				Reason:  "Finalizing",
				Message: fmt.Sprintf("Performing finalizer operations for the custom resource: %s ", project.Name),
			}

			if err := r.UpdateCondition(ctx, project, condition); err != nil {
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

			condition = metav1.Condition{
				Type:    typeDegradedProject,
				Status:  metav1.ConditionTrue,
				Reason:  "Finalizing",
				Message: fmt.Sprintf("Finalizer operations for custom resource %s name were successfully accomplished", project.Name),
			}

			if err := r.UpdateCondition(ctx, project, condition); err != nil {
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
		return ctrl.Result{Requeue: true}, nil
	}

	objects := []struct {
		obj    client.Object
		key    types.NamespacedName
		create func(*corev1alpha1.Project) client.Object
	}{
		{
			obj:    &v1.Namespace{},
			key:    types.NamespacedName{Name: project.Name},
			create: r.CreateNamespaceForProject,
		},
		{
			obj:    &v1.ServiceAccount{},
			key:    types.NamespacedName{Name: project.Name, Namespace: project.Name},
			create: r.CreateServiceAccountForProject,
		},
		{
			obj:    &pipeline.Task{},
			key:    types.NamespacedName{Name: project.Name, Namespace: project.Name},
			create: r.CreateTaskForProject,
		},
		{
			obj:    &pipeline.Pipeline{},
			key:    types.NamespacedName{Name: project.Name, Namespace: project.Name},
			create: r.CreatePipelineForProject,
		},
		{
			obj:    &v1.ServiceAccount{},
			key:    types.NamespacedName{Name: project.Name, Namespace: project.Name},
			create: r.CreateServiceAccountForProject,
		},
		{
			obj:    &triggers.EventListener{},
			key:    types.NamespacedName{Name: project.Name, Namespace: project.Name},
			create: r.CreateEventListenerForProject,
		},
	}

	for i, v := range objects {

		log.Info("checking", "i", i, "max", len(objects))
		err := r.Get(ctx, v.key, v.obj)
		if err == nil {
			continue
		}
		log.Info("error after get", "err", err.Error())

		if apierrors.IsNotFound(err) {
			log.Info("not found", "i", i, "max", len(objects))
			newObject := v.create(project)
			if err := ctrl.SetControllerReference(project, newObject, r.Scheme); err != nil {
				return ctrl.Result{}, err
			}
			if err = r.Create(ctx, newObject); err != nil {
				log.Error(err, "Failed to create new Resource", "Resource.Name", newObject.GetName(), "Resource.Kind", newObject.GetObjectKind())
				condition := metav1.Condition{
					Type:    typeDegradedProject,
					Status:  metav1.ConditionFalse,
					Reason:  "Reconciling",
					Message: fmt.Sprintf("Failed to create Resource for Project error: %s", err.Error()),
				}

				if err := r.UpdateCondition(ctx, project, condition); err != nil {
					log.Error(err, "Failed to update Project status")
					return ctrl.Result{}, err
				}

				return ctrl.Result{}, err
			}
			condition := metav1.Condition{
				Type:    typeAvailableProject,
				Status:  metav1.ConditionUnknown,
				Reason:  "Reconciling",
				Message: fmt.Sprintf("Created Resource: %d of %d", i, len(objects)),
			}

			if err := r.UpdateCondition(ctx, project, condition); err != nil {
				log.Error(err, "Failed to update Project status")
				return ctrl.Result{}, err
			}

			return ctrl.Result{Requeue: true}, nil
		}

		condition := metav1.Condition{
			Type:    typeErrorProject,
			Status:  metav1.ConditionUnknown,
			Reason:  "Reconciling",
			Message: fmt.Sprintf("Failed to get Resource for Project error: %s", err.Error()),
		}
		if err := r.UpdateCondition(ctx, project, condition); err != nil {
			log.Error(err, "Failed to update Project status")
			return ctrl.Result{}, err
		}
		log.Error(err, "Failed to get Resource")
		return ctrl.Result{}, err

	}

	condition := metav1.Condition{
		Type:    typeAvailableProject,
		Status:  metav1.ConditionTrue,
		Reason:  "Reconciling",
		Message: "Project created successfully",
	}

	if err := r.UpdateCondition(ctx, project, condition); err != nil {
		log.Error(err, "Failed to update Project")
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *ProjectReconciler) CreateNamespaceForProject(project *corev1alpha1.Project) client.Object {
	ns := &v1.Namespace{
		ObjectMeta: *r.createObjectMeta(project),
	}
	return ns
}

func (r *ProjectReconciler) CreateTaskForProject(project *corev1alpha1.Project) client.Object {
	task := &pipeline.Task{
		ObjectMeta: *r.createObjectMeta(project),
		Spec: pipeline.TaskSpec{
			Params: pipeline.ParamSpecs{
				pipeline.ParamSpec{
					Name: "username",
					Type: "string",
				},
			},
			Steps: []pipeline.Step{
				{
					Name:  "echo",
					Image: "ubuntu",
					Script: `#!/bin/bash
        echo "Goodbye $(params.username)!"`,
				},
			},
		},
	}
	return task
}

func (r *ProjectReconciler) CreatePipelineForProject(project *corev1alpha1.Project) client.Object {
	pipeline := &pipeline.Pipeline{
		ObjectMeta: *r.createObjectMeta(project),
		Spec: pipeline.PipelineSpec{
			Params: pipeline.ParamSpecs{
				pipeline.ParamSpec{
					Name: "username",
					Type: "string",
				},
			},
			Tasks: []pipeline.PipelineTask{
				{
					Name: project.Name,
					TaskRef: &pipeline.TaskRef{
						Name: project.Name,
					},
					Params: pipeline.Params{
						pipeline.Param{
							Name: "username",
							Value: pipeline.ParamValue{
								Type:      "string",
								StringVal: "$(params.username)",
							},
						},
					},
				},
			},
		},
	}
	return pipeline
}

func (r *ProjectReconciler) CreateServiceAccountForProject(project *corev1alpha1.Project) client.Object {
	serviceAccount := &v1.ServiceAccount{
		ObjectMeta: *r.createObjectMeta(project),
	}
	return serviceAccount
}

func (r *ProjectReconciler) CreateEventListenerForProject(project *corev1alpha1.Project) client.Object {
	eventListener := &triggers.EventListener{

		ObjectMeta: *r.createObjectMeta(project),
		Spec: triggers.EventListenerSpec{
			ServiceAccountName: project.Name,
			Triggers: []triggers.EventListenerTrigger{
				{
					Name: project.Name,
					Bindings: []*triggers.EventListenerBinding{
						&triggers.TriggerSpecBinding{
							Ref: project.Name,
						},
					},
					Template: &triggers.TriggerSpecTemplate{
						Ref: &project.Name,
					},
				},
			},
		},
	}
	return eventListener
}

func (r *ProjectReconciler) UpdateCondition(ctx context.Context, project *corev1alpha1.Project, condition metav1.Condition) error {
	meta.SetStatusCondition(&project.Status.Conditions, condition)
	return r.Status().Update(ctx, project)
}

func (r *ProjectReconciler) createObjectMeta(project *corev1alpha1.Project) *metav1.ObjectMeta {
	return &metav1.ObjectMeta{
		Name:      project.Name,
		Namespace: project.Name,
		Labels: map[string]string{
			"app.kubernetes.io/name":       "project-operator",
			"app.kubernetes.io/managed-by": "ProjectController",
		},
	}
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

// SetupWithManager sets up the controller with the Manager.
func (r *ProjectReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1alpha1.Project{}).
		Owns(&v1.Namespace{}).
		Complete(r)
}
