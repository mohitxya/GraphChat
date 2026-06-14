"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  ExplanationNode,
  type GraphChatNodeData,
  type PersistentHighlight
} from "@/components/canvas/nodes/ExplanationNode";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  anchors: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    selectedText: string;
    startOffset: number | null;
    endOffset: number | null;
    prefixText: string | null;
    suffixText: string | null;
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

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return { error: await response.text() };
}

export function ConversationCanvas({ conversation }: ConversationCanvasProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [isAddRootOpen, setIsAddRootOpen] = useState(false);
  const [rootQuestion, setRootQuestion] = useState("");
  const [anchors, setAnchors] = useState(conversation.anchors);

  function getPersistentHighlights(nodeId: string, anchorList = anchors): PersistentHighlight[] {
    return anchorList
      .filter((anchor) => anchor.sourceNodeId === nodeId)
      .map((anchor) => ({
        id: anchor.id,
        selectedText: anchor.selectedText,
        startOffset: anchor.startOffset,
        endOffset: anchor.endOffset,
        prefixText: anchor.prefixText,
        suffixText: anchor.suffixText
      }));
  }

  function toFlowNode(node: SerializableConversation["nodes"][number], anchorList = anchors): Node<GraphChatNodeData> {
    return {
      id: node.id,
      type: node.type === "root" ? "explanation" : "branch",
      position: { x: node.x, y: node.y },
      data: {
        id: node.id,
        type: node.type,
        question: node.question,
        content: node.content,
        selectedText: node.selectedText,
        persistentHighlights: getPersistentHighlights(node.id, anchorList),
        onAskSpan,
        onDeleteNode
      }
    };
  }

  const initialNodes: Node<GraphChatNodeData>[] = conversation.nodes.map((node) =>
    toFlowNode(node, conversation.anchors)
  );

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

      const result = await readJsonResponse(response);
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
          persistentHighlights: [],
          onAskSpan,
          onDeleteNode
        }
      };

      setNodes((current) => current.concat(newNode));
      setEdges((current) => current.concat(toFlowEdge(result.edge)));
      setAnchors((current) => {
        const nextAnchors = current.concat(result.anchor);
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === sourceNodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    persistentHighlights: getPersistentHighlights(node.id, nextAnchors)
                  }
                }
              : node
          )
        );
        return nextAnchors;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsAsking(false);
    }
  }

  async function onAddRoot() {
    if (!rootQuestion.trim()) {
      return;
    }

    setIsAddingRoot(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/add-root`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: rootQuestion })
      });

      const result = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to add root node.");
      }

      setNodes((current) => current.concat(toFlowNode(result.node, anchors)));
      setRootQuestion("");
      setIsAddRootOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsAddingRoot(false);
    }
  }

  async function onDeleteNode(nodeId: string) {
    const confirmed = window.confirm("Delete this node and its child branches?");
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });
      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to delete node.");
      }

      if (result.conversationDeleted) {
        router.push("/");
        return;
      }

      const deletedNodeIds = new Set<string>(result.deletedNodeIds);
      const deletedEdgeIds = new Set<string>(result.deletedEdgeIds);

      setAnchors((current) => {
        const nextAnchors = current.filter(
          (anchor) => !deletedNodeIds.has(anchor.sourceNodeId) && !deletedNodeIds.has(anchor.targetNodeId)
        );

        setNodes((currentNodes) =>
          currentNodes
            .filter((node) => !deletedNodeIds.has(node.id))
            .map((node) => ({
              ...node,
              data: {
                ...node.data,
                persistentHighlights: getPersistentHighlights(node.id, nextAnchors)
              }
            }))
        );

        return nextAnchors;
      });

      setEdges((current) =>
        current.filter(
          (edge) =>
            !deletedEdgeIds.has(edge.id) &&
            !deletedNodeIds.has(edge.source) &&
            !deletedNodeIds.has(edge.target)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        <div className="pointer-events-auto border border-border bg-panel/95 p-3 shadow-node">
          {isAddRootOpen ? (
            <div className="w-80">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-accent">New root</div>
                <button
                  type="button"
                  onClick={() => setIsAddRootOpen(false)}
                  className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-foreground"
                  aria-label="Close add root"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                value={rootQuestion}
                onChange={(event) => setRootQuestion(event.target.value)}
                placeholder="Ask another root question..."
                className="min-h-20"
              />
              <Button
                type="button"
                disabled={isAddingRoot || !rootQuestion.trim()}
                onClick={onAddRoot}
                className="mt-3 w-full"
              >
                {isAddingRoot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add root
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" onClick={() => setIsAddRootOpen(true)}>
              <Plus className="h-4 w-4" />
              New root
            </Button>
          )}
        </div>
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
