import { ReactNode } from "react";

export type LayoutType = 'split' | 'grid' | 'timeline' | 'master-detail';

export interface StepSpec {
  id: string;
  title: string;
  icon: string;
  goal: string;
  layout: LayoutType;
  sections: {
    leftPanel: string[];
    mainWorkspace: string[];
    rightAIPanel: string[];
    bottomArea?: string[];
  };
  details: {
    inputs: string[];
    actions: string[];
    generatedAssets: string[];
  };
  handoff: {
    actionName: string;
    description: string;
    lockedDependencies: string[];
  };
  states: {
    empty: string;
    loading: string;
    processing?: string;
    error: string;
    success?: string;
    locked: string;
  };
}
