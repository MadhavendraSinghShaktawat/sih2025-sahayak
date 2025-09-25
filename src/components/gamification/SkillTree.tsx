"use client";

import * as React from "react";
import ReactFlow, { Background, Controls, Node, Edge, useReactFlow } from "reactflow";
import "reactflow/dist/style.css";

type Branch = "digital" | "financial" | "mental";

// Simple demo config – later we can load from server/courses
const branchNodes: Record<Branch, Array<{ id: string; label: string }>> = {
  digital: [
    { id: "d1", label: "Basics" },
    { id: "d2", label: "Cyber Safety" },
    { id: "d3", label: "Productivity" },
  ],
  financial: [
    { id: "f1", label: "Money 101" },
    { id: "f2", label: "Budgeting" },
    { id: "f3", label: "Saving" },
  ],
  mental: [
    { id: "m1", label: "Awareness" },
    { id: "m2", label: "Habits" },
    { id: "m3", label: "Resilience" },
  ],
};

function buildGraph(selected: Branch, unlocked: Set<string>) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // start + root choices
  const startY = 0;
  const rootY = 100;
  const spacingX = 320;
  const roots: Array<{ id: Branch; label: string }> = [
    { id: "digital", label: "Digital Literacy" },
    { id: "financial", label: "Financial Literacy" },
    { id: "mental", label: "Mental Health" },
  ];

  // Start node (centered over the middle root)
  nodes.push({
    id: "start",
    position: { x: spacingX, y: startY },
    data: { label: "Start" },
    type: "input",
    style: {
      borderRadius: 12,
      padding: 8,
      border: "2px solid #6366f1",
      background: "#eef2ff",
      boxShadow: "0 0 24px rgba(99,102,241,0.25)",
    },
  });

  roots.forEach((r, i) => {
    const x = i * spacingX;
    nodes.push({
      id: r.id,
      position: { x, y: rootY },
      data: { label: `${r.label}  🔒` },
      style: {
        borderRadius: 12,
        padding: 8,
        border: "2px solid #c7d2fe",
        background: "#ffffff",
      },
    });
    edges.push({ id: `start->${r.id}`, source: "start", target: r.id, animated: true, style: { strokeDasharray: "6 4" } });
  });

  // branch path
  const list = branchNodes[selected];
  list.forEach((item, i) => {
    const id = `${selected}-${item.id}`;
    const x = (roots.findIndex((r) => r.id === selected) || 0) * spacingX;
    const y = 150 + i * 120;
    const locked = !unlocked.has(id);
    nodes.push({
      id,
      position: { x, y },
      data: { label: `${item.label}  🔒${locked ? " (locked)" : ""}` },
      style: {
        borderRadius: 12,
        padding: 8,
        border: `2px solid ${locked ? "#e5e7eb" : "#6ee7b7"}`,
        background: locked ? "#f9fafb" : "#ecfdf5",
      },
    });
    const prevId = i === 0 ? selected : `${selected}-${list[i - 1].id}`;
    edges.push({ id: `${prevId}->${id}`, source: prevId, target: id, animated: !locked, style: { strokeDasharray: locked ? "6 6" : undefined } });
  });

  return { nodes, edges };
}

export default function SkillTree() {
  const [branch, setBranch] = React.useState<Branch>("digital");
  const [unlocked, setUnlocked] = React.useState<Set<string>>(new Set(["digital-d1"]));
  const [pending, setPending] = React.useState<string | null>(null);
  const [height, setHeight] = React.useState<number>(600);

  const { nodes, edges } = React.useMemo(() => buildGraph(branch, unlocked), [branch, unlocked]);

  const handleNodeClick = (_: any, node: Node) => {
    if (node.id.includes("-")) {
      const isUnlocked = unlocked.has(node.id);
      if (!isUnlocked) setPending(node.id); // show action modal
    } else if (node.id === "start") {
      // no-op for start
    } else {
      // switching root branch
      setBranch(node.id as Branch);
    }
  };

  // Responsive full-window canvas height
  React.useEffect(() => {
    const compute = () => {
      const topOffset = 160; // header/spacing approx
      setHeight(Math.max(420, window.innerHeight - topOffset));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return (
    <div className="w-full rounded-xl border bg-white" style={{ height, overflow: 'hidden' }}>
      <div className="flex items-center justify-between p-3 border-b select-none">
        <div className="font-semibold">Skill Tree</div>
        <div className="flex gap-2">
          {(["digital", "financial", "mental"] as Branch[]).map((b) => (
            <button
              key={b}
              onClick={() => setBranch(b)}
              className={`px-3 py-1 rounded-full text-sm border transition ${branch === b ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white hover:bg-gray-50"}`}
            >
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        style={{ cursor: "default", overflow: 'hidden' }}
      >
        <Background gap={18} color="#eef2ff" />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>

      {pending && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-80 shadow-xl">
            <div className="font-semibold mb-2">Unlock Node</div>
            <p className="text-sm text-gray-600 mb-4">Complete a quick action to unlock this skill (demo: click confirm).</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 text-sm" onClick={() => setPending(null)}>Cancel</button>
              <button
                className="px-3 py-1 text-sm rounded-md bg-emerald-600 text-white"
                onClick={() => {
                  const next = new Set(unlocked);
                  next.add(pending);
                  setUnlocked(next);
                  setPending(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


