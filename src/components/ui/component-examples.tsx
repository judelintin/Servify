"use client";
import { useState } from "react";
import { Button, Feedback } from "./primitives";

export function ButtonExamples() {
  const [example, setExample] = useState("");
  return <><div className="component-row"><Button onClick={() => setExample("Primary button activated.")}>Primary</Button><Button variant="secondary" onClick={() => setExample("Secondary button activated.")}>Secondary</Button><Button variant="ghost" onClick={() => setExample("")}>Reset demo</Button><Button variant="accent" onClick={() => setExample("Accent button activated.")}>Accent</Button><Button disabled>Disabled</Button></div><p className="field-hint mt-4">Component examples only. These controls do not create marketplace activity.</p>{example && <div className="mt-4"><Feedback title={example} live>Local component interaction only.</Feedback></div>}</>;
}
