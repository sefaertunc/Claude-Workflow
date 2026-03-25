import { describe, it, expect } from 'vitest';
import { buildAgentRoutingSkill } from '../../src/generators/agent-routing.js';
import { UNIVERSAL_AGENTS, AGENT_CATALOG } from '../../src/data/agents.js';
import { AGENT_REGISTRY } from '../../src/data/agent-registry.js';

describe('buildAgentRoutingSkill', () => {
  it('generates routing with only universal agents when no optional selected', () => {
    const result = buildAgentRoutingSkill([], []);

    for (const agent of UNIVERSAL_AGENTS) {
      expect(result).toContain(`### ${agent}`);
    }
    // Should NOT contain any optional agents
    expect(result).not.toContain('### api-designer');
    expect(result).not.toContain('### ui-reviewer');
  });

  it('includes backend agents when selected', () => {
    const result = buildAgentRoutingSkill(
      ['api-designer', 'database-analyst', 'auth-auditor'],
      ['Backend / API']
    );

    expect(result).toContain('### api-designer');
    expect(result).toContain('### database-analyst');
    expect(result).toContain('### auth-auditor');
  });

  it('generates all 23 agents when all optional agents selected', () => {
    const allOptional = Object.keys(AGENT_CATALOG);
    const result = buildAgentRoutingSkill(allOptional, []);

    // Check all 23 agents are present
    for (const agent of UNIVERSAL_AGENTS) {
      expect(result).toContain(`### ${agent}`);
    }
    for (const agent of allOptional) {
      expect(result).toContain(`### ${agent}`);
    }
  });

  it('has correct number of Decision Matrix rows', () => {
    // Universal only = 5 rows
    const resultUniversal = buildAgentRoutingSkill([], []);
    const universalRows = resultUniversal
      .split('\n')
      .filter((line) => line.startsWith('| ') && !line.startsWith('| You just') && !line.startsWith('|---'));
    expect(universalRows).toHaveLength(UNIVERSAL_AGENTS.length);

    // All agents = 23 rows
    const allOptional = Object.keys(AGENT_CATALOG);
    const resultAll = buildAgentRoutingSkill(allOptional, []);
    const allRows = resultAll
      .split('\n')
      .filter((line) => line.startsWith('| ') && !line.startsWith('| You just') && !line.startsWith('|---'));
    expect(allRows).toHaveLength(UNIVERSAL_AGENTS.length + allOptional.length);
  });

  it('partitions automatic and manual triggers correctly', () => {
    const result = buildAgentRoutingSkill([], []);

    // Automatic trigger section should contain these agents
    const autoSection = result.split('## Manual Triggers')[0];
    expect(autoSection).toContain('### test-writer');
    expect(autoSection).toContain('### code-simplifier');
    expect(autoSection).toContain('### build-validator');

    // Manual trigger section should contain these agents
    const manualSection = result.split('## Manual Triggers')[1].split('## Decision Matrix')[0];
    expect(manualSection).toContain('### plan-reviewer');
    expect(manualSection).toContain('### verify-app');
  });

  it('contains all expected section headers', () => {
    const result = buildAgentRoutingSkill([], []);

    expect(result).toContain('# Agent Routing Guide');
    expect(result).toContain('## How Agents Work');
    expect(result).toContain('## Automatic Triggers');
    expect(result).toContain('## Manual Triggers');
    expect(result).toContain('## Decision Matrix');
    expect(result).toContain('## Rules');
  });

  it('includes model and isolation info for each agent', () => {
    const result = buildAgentRoutingSkill(['api-designer'], []);

    // plan-reviewer is Opus, no isolation
    expect(result).toContain('**Model:** Opus | **Isolation:** None');
    // test-writer is Sonnet, worktree
    expect(result).toContain('**Model:** Sonnet | **Isolation:** Worktree');
    // build-validator is Haiku
    expect(result).toContain('**Model:** Haiku | **Isolation:** None');
  });

  it('only includes selected optional agents, not all', () => {
    const result = buildAgentRoutingSkill(['ui-reviewer', 'bug-fixer'], []);

    expect(result).toContain('### ui-reviewer');
    expect(result).toContain('### bug-fixer');
    expect(result).not.toContain('### api-designer');
    expect(result).not.toContain('### docker-helper');
    expect(result).not.toContain('### prompt-engineer');
  });

  it('shows trigger commands for agents that have them', () => {
    const result = buildAgentRoutingSkill([], []);

    expect(result).toContain('/review-plan');
    expect(result).toContain('/simplify');
    expect(result).toContain('/verify');
  });
});

describe('AGENT_REGISTRY completeness', () => {
  it('has entries for all universal agents', () => {
    for (const agent of UNIVERSAL_AGENTS) {
      expect(AGENT_REGISTRY[agent]).toBeDefined();
      expect(AGENT_REGISTRY[agent].category).toBe('universal');
    }
  });

  it('has entries for all optional agents in AGENT_CATALOG', () => {
    for (const agent of Object.keys(AGENT_CATALOG)) {
      expect(AGENT_REGISTRY[agent]).toBeDefined();
    }
  });

  it('has all required fields for every agent', () => {
    const requiredFields = [
      'category',
      'model',
      'isolation',
      'triggerType',
      'whenToUse',
      'whatItDoes',
      'expectBack',
      'situationLabel',
    ];

    for (const [name, entry] of Object.entries(AGENT_REGISTRY)) {
      for (const field of requiredFields) {
        expect(entry[field], `${name} missing ${field}`).toBeDefined();
      }
    }
  });

  it('has exactly 23 agents (5 universal + 18 optional)', () => {
    expect(Object.keys(AGENT_REGISTRY)).toHaveLength(23);
  });
});
