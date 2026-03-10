# Project Overview

Deterministic motion graphics video generation platform.

Goal:
User Prompt → Motion Spec → Animation Code → Remotion → Video Output


# Current Pipeline

convertToSpec
batchRunner
Remotion render


# Prompt Dataset

Level 1.0 – Basic shapes
Level 1.1 – Complex single shape physics
Level 1.2 – Multi-object coordination


# Key Design Principle

All animations should be deterministic.

No random behavior.


# Known Problems

Spec JSON becoming too large
LLM confusion with complex coordination
Need future support for real-world assets


# Folder Structure

/prompts
/spec
/skills
/rules
/scripts
/outputs