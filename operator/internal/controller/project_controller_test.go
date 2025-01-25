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

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	corev1alpha1 "github.com/pascal-sochacki/plattform/api/v1alpha1"
	pipeline "github.com/tektoncd/pipeline/pkg/apis/pipeline/v1"
)

var _ = Describe("Project Controller", func() {
	Context("When reconciling a resource", func() {
		const resourceName = "test-resource"

		ctx := context.Background()

		typeNamespacedName := types.NamespacedName{
			Name: resourceName,
		}
		resource := &corev1alpha1.Project{
			ObjectMeta: metav1.ObjectMeta{
				Name:      resourceName,
				Namespace: "default",
			},
		}

		BeforeEach(func() {
			By("creating the custom resource for the Kind Project")
			project := &corev1alpha1.Project{}
			err := k8sClient.Get(ctx, typeNamespacedName, project)
			if err != nil && errors.IsNotFound(err) {
				Expect(k8sClient.Create(ctx, resource)).To(Succeed())
			}
		})

		AfterEach(func() {
			// TODO(user): Cleanup logic after each test, like removing the resource instance.
			resource := &corev1alpha1.Project{}
			err := k8sClient.Get(ctx, typeNamespacedName, resource)
			Expect(err).NotTo(HaveOccurred())

			By("Cleanup the specific resource instance Project")
			Expect(k8sClient.Delete(ctx, resource)).To(Succeed())
		})

		It("should successfully reconcile the resource", func() {
			By("Reconciling the created resource")
			controllerReconciler := &ProjectReconciler{
				Client: k8sClient,
				Scheme: k8sClient.Scheme(),
			}

			_, err := controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).NotTo(HaveOccurred())

			By("Checking if Condition was successfully updated in the reconciliation")
			project := &corev1alpha1.Project{}
			err = k8sClient.Get(ctx, typeNamespacedName, project)
			Expect(err).NotTo(HaveOccurred())
			Expect(len(project.Status.Conditions)).To(Equal(1))
			Expect(project.Status.Conditions[0].Message).To(Equal("Starting reconciliation"))

			By("Checking if Finalizer was successfully updated in the reconciliation")
			finalizer := project.GetFinalizers()
			Expect(len(finalizer)).To(Equal(1))
			Expect(finalizer[0]).To(Equal("core.plattf0rm.de/finalizer"))

			_, err = controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).NotTo(HaveOccurred())

			By("Checking if Namespace was successfully created in the reconciliation")
			foundNamespace := &v1.Namespace{}
			err = k8sClient.Get(ctx, types.NamespacedName{
				Name: resourceName,
			}, foundNamespace)
			Expect(err).NotTo(HaveOccurred())

			_, err = controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})

			By("Checking if ServiceAccount was successfully created in the reconciliation")
			foundServiceAccount := &v1.ServiceAccount{}
			err = k8sClient.Get(ctx, types.NamespacedName{
				Name:      resourceName,
				Namespace: project.Name,
			}, foundServiceAccount)
			Expect(err).NotTo(HaveOccurred())

			_, err = controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})

			By("Checking if Task was successfully created in the reconciliation")
			foundTask := &pipeline.Task{}
			err = k8sClient.Get(ctx, types.NamespacedName{
				Name:      resourceName,
				Namespace: project.Name,
			}, foundTask)
			Expect(err).NotTo(HaveOccurred())

			_, err = controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).NotTo(HaveOccurred())

			By("checking if pipeline was successfully created in the reconciliation")
			foundPipeline := &pipeline.Pipeline{}
			err = k8sClient.Get(ctx, types.NamespacedName{
				Name:      resourceName,
				Namespace: project.Name,
			}, foundPipeline)
			Expect(err).NotTo(HaveOccurred())

			_, err = controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).NotTo(HaveOccurred())
			_, err = controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).NotTo(HaveOccurred())
			_, err = controllerReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).NotTo(HaveOccurred())

			By("Checking if Condition was successfully updated in the reconciliation")
			project = &corev1alpha1.Project{}
			err = k8sClient.Get(ctx, typeNamespacedName, project)
			Expect(err).NotTo(HaveOccurred())
			Expect(len(project.Status.Conditions)).To(Equal(2))
			Expect(project.Status.Conditions[1].Message).To(Equal("Project created successfully"))

		})
	})
})
