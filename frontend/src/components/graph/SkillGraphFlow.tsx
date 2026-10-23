import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SkillNode } from './SkillNode';
import { SkillDetailDrawer } from './SkillDetailDrawer';
import { SkillGraphResponse, GraphNodeData } from '../../types';
import {
  Search,
  Filter,
  Layers,
  Table as TableIcon,
  Network,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Sparkles,
} from 'lucide-react';

const nodeTypes = {
  skillNode: SkillNode,
};

interface SkillGraphFlowProps {
  graphData: SkillGraphResponse;
  onTakeAssessment: (skillId: number) => void;
  onGoToRoadmap: () => void;
}

export const SkillGraphFlow: React.FC<SkillGraphFlowProps> = ({
  graphData,
  onTakeAssessment,
  onGoToRoadmap,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    graphData.nodes.forEach((n) => cats.add(n.category));
    return Array.from(cats);
  }, [graphData.nodes]);

  // Handle node selection
  const handleSelectNode = useCallback((nodeData: GraphNodeData) => {
    setSelectedNode(nodeData);
  }, []);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((node) => {
      const matchesSearch =
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || node.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || node.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [graphData.nodes, searchQuery, statusFilter, categoryFilter]);

  // React Flow Nodes
  const rfNodes: Node[] = useMemo(() => {
    return filteredNodes.map((n) => ({
      id: n.id,
      type: 'skillNode',
      position: n.position || { x: 100, y: 100 },
      data: {
        ...n,
        onSelectNode: handleSelectNode,
      },
      selected: selectedNode?.id === n.id,
    }));
  }, [filteredNodes, selectedNode, handleSelectNode]);

  // React Flow Edges
  const rfEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        animated: e.is_satisfied,
        style: {
          stroke: e.is_satisfied ? '#10B981' : '#94A3B8',
          strokeWidth: e.is_satisfied ? 2 : 1.5,
          strokeDasharray: e.relationship_type === 'recommended' ? '4 4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.is_satisfied ? '#10B981' : '#94A3B8',
          width: 14,
          height: 14,
        },
      }));
  }, [graphData.edges, filteredNodes]);

  const [nodes, setNodes] = useState<Node[]>(rfNodes);
  const [edges, setEdges] = useState<Edge[]>(rfEdges);

  // Sync state when filters change
  React.useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Control Bar */}
      <div className="p-3 sm:px-4 sm:py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 cursor-pointer focus:border-blue-600 focus:outline-hidden"
          >
            <option value="all">All Statuses ({graphData.total_skills})</option>
            <option value="demonstrated">
              Demonstrated ({graphData.demonstrated_count})
            </option>
            <option value="developing">Developing ({graphData.developing_count})</option>
            <option value="missing">Missing ({graphData.missing_count})</option>
            <option value="unassessed">
              Unassessed ({graphData.unassessed_count})
            </option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 cursor-pointer focus:border-blue-600 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Metrics & View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {graphData.demonstrated_count} Verified
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-blue-700">
              <Sparkles className="w-3.5 h-3.5" />
              {graphData.ready_to_learn_count} Prereq-Ready
            </span>
          </div>

          {/* Graph vs Table Toggle */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md border border-slate-300">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'graph'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DAG View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative">
        {viewMode === 'graph' ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background color="#CBD5E1" gap={20} size={1} />
            <Controls className="!bg-white !border !border-slate-300 !shadow-xs" />
            <MiniMap
              nodeColor={(node: any) => {
                switch (node.data?.status) {
                  case 'demonstrated':
                    return '#10B981';
                  case 'developing':
                    return '#F59E0B';
                  case 'missing':
                    return '#EF4444';
                  default:
                    return '#CBD5E1';
                }
              }}
              className="!border !border-slate-200 !rounded-md"
            />
          </ReactFlow>
        ) : (
          /* Accessible Table/List View Alternative */
          <div className="h-full overflow-y-auto p-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Skill Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Demonstrated Status</th>
                    <th className="px-4 py-3">Prerequisites</th>
                    <th className="px-4 py-3">Role Requirement</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredNodes.map((n) => (
                    <tr
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {n.label}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{n.category}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">
                        {n.difficulty}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            n.status === 'demonstrated'
                              ? 'bg-emerald-100 text-emerald-800'
                              : n.status === 'developing'
                              ? 'bg-amber-100 text-amber-800'
                              : n.status === 'missing'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {n.status}
                          {n.proficiency_score > 0 && ` (${n.proficiency_score}%)`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {n.is_prerequisite_ready ? (
                          <span className="text-emerald-700 font-medium">
                            Ready to learn
                          </span>
                        ) : (
                          <span className="text-amber-700">
                            {n.missing_prerequisites.join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {n.is_role_required ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-medium text-[10px] uppercase">
                            {n.role_importance || 'Required'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Optional</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(n);
                          }}
                          className="text-xs text-blue-700 hover:text-blue-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Skill Details Drawer */}
        <SkillDetailDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onTakeAssessment={onTakeAssessment}
          onGoToRoadmap={onGoToRoadmap}
        />
      </div>
    </div>
  );
};
