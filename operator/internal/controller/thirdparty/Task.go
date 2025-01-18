// +k8s:deepcopy-gen=package
// +kubebuilder:skip
package thirdparty

// https://github.com/tektoncd/pipeline/tree/main/pkg/apis/pipeline/v1
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

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type Pipeline struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              PipelineSpec `json:"spec"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type PipelineList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Pipeline `json:"items"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type EventListener struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              EventListenerSpec `json:"spec"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type EventListenerList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []EventListener `json:"items"`
}

type EventListenerSpec struct {
	ServiceAccountName string                 `json:"serviceAccountName,omitempty"`
	Triggers           []EventListenerTrigger `json:"triggers,omitempty"`
}

type EventListenerTrigger struct {
	Name     string                  `json:"name,omitempty"`
	Bindings []*EventListenerBinding `json:"bindings,omitempty"`
	Template *EventListenerTemplate  `json:"template,omitempty"`
}

type EventListenerTemplate = TriggerSpecTemplate
type EventListenerBinding = TriggerSpecBinding

type TriggerSpecTemplate struct {
	Ref *string `json:"ref,omitempty"`
}

type TriggerSpecBinding struct {
	Name string `json:"name,omitempty"`
}

type PipelineSpec struct {
	DisplayName string         `json:"displayName,omitempty"`
	Description string         `json:"description,omitempty"`
	Tasks       []PipelineTask `json:"tasks,omitempty"`
	Params      ParamSpecs     `json:"params,omitempty"`
}

type PipelineTask struct {
	Name    string   `json:"name,omitempty"`
	TaskRef *TaskRef `json:"taskRef,omitempty"`
	Params  Params   `json:"params,omitempty"`
}
type ParamType string
type Params []Param
type Param struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type ParamValue struct {
	Type      ParamType // Represents the stored type of ParamValues.
	StringVal string
	// +listType=atomic
	ArrayVal  []string
	ObjectVal map[string]string
}

type ParamSpecs []ParamSpec
type ParamSpec struct {
	Name string    `json:"name"`
	Type ParamType `json:"type,omitempty"`
}

type TaskRef struct {
	Name string `json:"name,omitempty"`
}

type TaskSpec struct {
	Steps  []Step     `json:"steps,omitempty"`
	Params ParamSpecs `json:"params,omitempty"`
}

type Step struct {
	Name   string `json:"name" protobuf:"bytes,1,opt,name=name"`
	Image  string `json:"image,omitempty" protobuf:"bytes,2,opt,name=image"`
	Script string `json:"script,omitempty"`
}
