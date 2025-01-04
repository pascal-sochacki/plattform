// +k8s:deepcopy-gen=package
// +kubebuilder:skip
package thirdparty

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type Task struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec TaskSpec `json:"spec"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type TaskList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Task `json:"items"`
}

type TaskSpec struct {
	Steps []Step `json:"steps,omitempty"`
}

type Step struct {
	Name   string `json:"name" protobuf:"bytes,1,opt,name=name"`
	Image  string `json:"image,omitempty" protobuf:"bytes,2,opt,name=image"`
	Script string `json:"script,omitempty"`
}
