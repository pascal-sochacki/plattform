package thirdparty

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const GroupName = "tekton.dev"
const GroupVersion = "v1"

var PipelineSchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: GroupVersion}
var TriggerSchemeGroupVersion = schema.GroupVersion{Group: "triggers.tekton.dev", Version: "v1beta1"}

var (
	PipelineSchemeBuilder = runtime.NewSchemeBuilder(addPipelineTypes)
	AddPipelineToScheme   = PipelineSchemeBuilder.AddToScheme
	TriggerSchemeBuilder  = runtime.NewSchemeBuilder(addTriggerTypes)
	AddTriggerToScheme    = TriggerSchemeBuilder.AddToScheme
)

func addPipelineTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(PipelineSchemeGroupVersion,
		&Task{},
		&TaskList{},
	)
	scheme.AddKnownTypes(PipelineSchemeGroupVersion,
		&Pipeline{},
		&PipelineList{},
	)

	metav1.AddToGroupVersion(scheme, PipelineSchemeGroupVersion)
	return nil
}

func addTriggerTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(TriggerSchemeGroupVersion,
		&EventListener{},
		&EventListenerList{},
	)
	scheme.AddKnownTypes(TriggerSchemeGroupVersion,
		&TriggerBinding{},
		&TriggerBindingList{},
	)
	scheme.AddKnownTypes(TriggerSchemeGroupVersion,
		&TriggerTemplate{},
		&TriggerTemplateList{},
	)

	metav1.AddToGroupVersion(scheme, TriggerSchemeGroupVersion)
	return nil
}
