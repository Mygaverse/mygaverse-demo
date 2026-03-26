export type ConsoleTab = 'design' | 'engineering' | 'intelligence';
export type ProductContext = 'scriptoplay' | 'bqool' | 'global';

// ─── Design Layer ───────────────────────────────────────────────────────────

export interface FigmaFrame {
  embedUrl: string;
  title: string;
}

export interface UXAuditPoint {
  id: string;
  title: string;
  description: string;
  category: 'layout' | 'accessibility' | 'performance' | 'interaction' | 'visual';
  impact: 'high' | 'medium' | 'low';
}

export interface DesignDecision {
  title: string;
  rationale: string;
}

export interface DesignContent {
  figmaFrame?: FigmaFrame;
  uxAuditPoints: UXAuditPoint[];
  designDecisions: DesignDecision[];
}

// ─── Engineering Layer ──────────────────────────────────────────────────────

export type CodeLayer = 'frontend' | 'backend' | 'database' | 'ai';

export interface CodeSnippet {
  label: string;
  language: string;
  code: string;
  githubUrl?: string;
  layer: CodeLayer;
}

export interface TechBadge {
  name: string;
  category: 'framework' | 'ai' | 'database' | 'infra' | 'ui';
}

export interface EngineeringContent {
  snippets: CodeSnippet[];
  techStack: TechBadge[];
  architectureNote?: string;
}

// ─── Intelligence Layer ─────────────────────────────────────────────────────

export interface SystemPrompt {
  label: string;
  model: string;
  content: string;
}

export type ChainStepType = 'input' | 'llm' | 'transform' | 'api' | 'output';

export interface ChainStep {
  id: string;
  title: string;
  description: string;
  type: ChainStepType;
}

export interface IntelligenceContent {
  systemPrompts: SystemPrompt[];
  chainOfThought: ChainStep[];
  note?: string;
}

// ─── Scene ──────────────────────────────────────────────────────────────────

export interface SceneData {
  id: string;
  title: string;
  subtitle?: string;
  product: ProductContext;
  design: DesignContent;
  engineering: EngineeringContent;
  intelligence: IntelligenceContent;
}
