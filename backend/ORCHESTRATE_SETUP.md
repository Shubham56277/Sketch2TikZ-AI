# IBM watsonx Orchestrate integration

Sketch2TikZ exposes a curated OpenAPI toolset for watsonx Orchestrate at:

`https://sketch2tikz-ai.onrender.com/orchestrate/openapi.json`

The toolset contains only these operations:

- `checkSketch2TikzAvailability`
- `generateAcademicTikzDiagram`
- `compileTikzDiagram`
- `repairInvalidTikzDiagram`

## Render configuration

Create a strong random secret and set it only in Render:

```text
ORCHESTRATE_API_KEY=<random secret>
```

Never commit or share this value. If it is unset, tool execution remains open
for an initial classroom demo.

## Import into watsonx Orchestrate

1. Open **Build > All agents** and create an agent named
   `Sketch2TikZ Research Diagram Agent`.
2. Open **Toolset > Add tool > Import OpenAPI**.
3. Import the curated OpenAPI URL above.
4. Enable all four operations.
5. Create an API-key connection whose header value is the same secret stored in
   `ORCHESTRATE_API_KEY`. The schema declares the header name as
   `X-Orchestrate-API-Key`.
6. Test the tools in Preview, then deploy the agent.

## Agent description

```text
Sketch2TikZ Research Diagram Agent converts natural-language descriptions into
professional LaTeX/TikZ academic diagrams. It generates TikZ, validates and
compiles diagrams, repairs compilation errors, and returns publication-ready
output. Use it for flowcharts, architecture diagrams, UML, mathematical
figures, research workflows, mind maps, and other academic illustrations.
```

## Agent behavior instructions

```text
You are the Sketch2TikZ Research Diagram Agent.

1. Understand the academic diagram requested by the user.
2. Ask for clarification only when essential information is missing.
3. Call generateAcademicTikzDiagram with the user's description.
4. Pass the returned code to compileTikzDiagram.
5. Claim success only when compilation status is success.
6. On compilation failure, call repairInvalidTikzDiagram with the code and
   compiler log, then compile the repaired code again.
7. Return a concise explanation, final TikZ code, and PDF URL.
8. For refinements, send the current code as existing_code and the requested
   change as the prompt, then compile the updated result.
9. Prefer colorful, balanced, publication-quality diagrams with readable
   labels, semantic shapes, clean borders, and non-overlapping connectors.
10. Never expose credentials, API keys, internal stack traces, or confidential
    configuration.
11. Stay focused on academic and technical diagrams.
```

## Preview test

```text
Create a colorful academic workflow showing a researcher describing a diagram,
IBM Granite generating TikZ, structural validation, secure LaTeX compilation,
automatic repair, and publication-ready PDF export.
```
