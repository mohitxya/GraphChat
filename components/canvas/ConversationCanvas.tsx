"use client";

import { useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeTypes,
  useEdgesState,
  useNodesState
} from "reactflow";
import "reactflow/dist/style.css";
import { BranchNode } from "@/components/canvas/nodes/BranchNode";
import { ExplanationNode, type GraphChatNodeData } from "@/components/canvas/nodes/ExplanationNode";
import type { SelectionAnchorPayload } from "@/lib/graph/types";

export type SerializableConversation = {
  id: string;
  title: string;
  nodes: Array<{
    id: string;
    type: "root" | "branch" | "summary" | "note";
    content: string;
    question: string | null;
    selectedText: string | null;
    x: number;
    y: number;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    type: string;
  }>;
};

type ConversationCanvasProps = {
  conversation: SerializableConversation;
};

const nodeTypes: NodeTypes = {
  explanation: ExplanationNode,
  branch: BranchNode
};

function toFlowEdge(edge: SerializableConversation["edges"][number]): Edge {
  return {
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    label: "asked about span",
    type: "smoothstep",
    style: { stroke: "#546179", strokeWidth: 1.7 },
    labelStyle: { fill: "#9aa4b2", fontSize: 11 },
    labelBgStyle: { fill: "#090b10", fillOpacity: 0.88 }
  };
}

export function ConversationCanvas({ conversation }: ConversationCanvasProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const initialNodes: Node<GraphChatNodeData>[] = conversation.nodes.map((node) => ({
    id: node.id,
    type: node.type === "root" ? "explanation" : "branch",
    position: { x: node.x, y: node.y },
    data: {
      id: node.id,
      type: node.type,
      question: node.question,
      content: node.content,
      selectedText: node.selectedText,
      onAskSpan
    }
  }));

  const initialEdges = conversation.edges.map(toFlowEdge);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  async function onAskSpan(sourceNodeId: string, payload: SelectionAnchorPayload & { userQuestion: string }) {
    setIsAsking(true);
    setError(null);
    try {
      const response = await fetch("/api/ask-span", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          sourceNodeId,
          ...payload
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to create branch node.");
      }

      const newNode: Node<GraphChatNodeData> = {
        id: result.node.id,
        type: result.node.type === "root" ? "explanation" : "branch",
        position: { x: result.node.x, y: result.node.y },
        data: {
          id: result.node.id,
          type: result.node.type,
          question: result.node.question,
          content: result.node.content,
          selectedText: result.node.selectedText,
          onAskSpan
        }
      };

      setNodes((current) => current.concat(newNode));
      setEdges((current) => current.concat(toFlowEdge(result.edge)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={(_, node) => {
          void fetch("/api/update-node-position", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodeId: node.id, x: node.position.x, y: node.position.y })
          });
        }}
        fitView
        minZoom={0.2}
        maxZoom={1.4}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#273142" gap={28} size={1} />
        <Controls className="!border-border !bg-panel !text-foreground" />
        <MiniMap
          className="!border !border-border !bg-panel"
          nodeColor={(node) => (node.type === "explanation" ? "#38bdf8" : "#f6c85f")}
          maskColor="rgba(9,11,16,0.72)"
        />
      </ReactFlow>
      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
        {isAsking ? (
          <div className="border border-border bg-panel/95 px-3 py-2 text-xs text-slate-300 shadow-node">
            Generating branch answer...
          </div>
        ) : null}
        {error ? (
          <div className="border border-red-500/40 bg-red-950/80 px-3 py-2 text-xs text-red-100 shadow-node">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
