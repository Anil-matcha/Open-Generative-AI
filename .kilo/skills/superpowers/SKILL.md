---
name: superpowers
description: This skill enables the Superpowers agentic skills framework for software development. Use this skill when building, planning, or implementing complex software features, debugging issues, or following systematic development workflows. It triggers automatically when the agent detects software development tasks and provides structured methodologies for brainstorming, planning, TDD, code review, and deployment.
---

# Superpowers

## Overview

Superpowers is a complete software development workflow for coding agents, built on top of a set of composable "skills" and initial instructions that ensure agents use them effectively. It transforms ad-hoc coding into systematic, high-quality software development with built-in testing, review, and iterative improvement.

## Core Capabilities

### 1. Brainstorming
Activates before writing code to refine rough ideas through questions, explore alternatives, and present design in digestible chunks for validation. Saves design documents and ensures requirements are well-understood before implementation.

### 2. Using Git Worktrees
Creates isolated development workspaces on new branches, sets up project environments, and verifies clean test baselines before starting work.

### 3. Writing Plans
Breaks approved designs into bite-sized tasks (2-5 minutes each) with exact file paths, complete code snippets, and verification steps. Emphasizes YAGNI, DRY principles, and clear implementation guidance.

### 4. Subagent-Driven Development / Executing Plans
Dispatches fresh subagents per task with two-stage review (spec compliance then code quality), or executes in batches with human checkpoints. Enables autonomous development for hours with periodic validation.

### 5. Test-Driven Development
Enforces RED-GREEN-REFACTOR cycle: write failing tests first, implement minimal code to pass, refactor while maintaining tests. Deletes code written before tests.

### 6. Systematic Debugging
Uses 4-phase root cause analysis: isolate symptoms, trace conditions, verify fixes, and implement defense-in-depth. Includes condition-based waiting and root-cause-tracing techniques.

### 7. Requesting Code Review
Pre-review checklists and feedback processing. Reviews against plans, reports issues by severity, and blocks progress on critical issues.

### 8. Finishing Development Branches
Verifies tests, presents merge/PR/discard options, and cleans up worktrees upon task completion.

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

## When to Use

Trigger this skill when:
- Starting new software development tasks
- Implementing complex features requiring planning
- Debugging production issues systematically
- Refactoring code with safety guarantees
- Building production-ready software with testing

## Usage Workflow

1. **Design Phase**: Brainstorm and write detailed implementation plans
2. **Development Phase**: Execute plans using subagent-driven development with TDD
3. **Review Phase**: Systematic code review and debugging
4. **Completion Phase**: Test verification and branch finishing

The agent checks for relevant skills before each task and enforces mandatory workflows, not suggestions.

## Resources

### scripts/
- `init_skill.py` - Initialize new skill templates
- `package_skill.py` - Package skills for distribution
- `quick_validate.py` - Validate skill structure

### references/
- `api_reference.md` - API documentation for skill development
- `philosophy.md` - Detailed philosophy and principles
- `workflow_guide.md` - Complete workflow documentation

### assets/
- `skill_template/` - Boilerplate for new skills
- `example_skills/` - Sample implemented skills
