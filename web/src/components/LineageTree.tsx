'use client';

import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CARGO_REGISTRY_ADDRESS } from '@/lib/constants';
import CARGO_REGISTRY_ABI from '@/components/CargoRegistryABI.json';
import { Network, ArrowUp, ArrowDown, ChevronRight, Layers, FileText, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LineageNode {
  id: number;
  parentId: number;
  weight: number;
  status: string;
  origin: string;
  isCurrent: boolean;
}

export default function LineageTree({ activeTokenId }: { activeTokenId: number }) {
  const publicClient = usePublicClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [rootNode, setRootNode] = useState<LineageNode | null>(null);
  const [parentChain, setParentChain] = useState<LineageNode[]>([]);
  const [childChain, setChildChain] = useState<LineageNode[]>([]);
  const [siblings, setSiblings] = useState<LineageNode[]>([]);

  useEffect(() => {
    async function loadTree() {
      if (!publicClient || !activeTokenId) return;
      setLoading(true);
      try {
        // 1. Fetch details of active token
        const activeDetails = await fetchNodeDetails(activeTokenId);
        
        // 2. Fetch parent token ID
        const parentId = Number(
          ((await publicClient.readContract({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'parentTokenOf',
            args: [BigInt(activeTokenId)],
          })) as bigint).toString()
        );

        // Reconstruct Ancestor Path
        const chain: LineageNode[] = [];
        let currParentId = parentId;
        while (currParentId > 0) {
          try {
            const pNode = await fetchNodeDetails(currParentId);
            chain.unshift(pNode); // prepend to have root first
            
            // Check next parent
            currParentId = Number(
              ((await publicClient.readContract({
                address: CARGO_REGISTRY_ADDRESS,
                abi: CARGO_REGISTRY_ABI,
                functionName: 'parentTokenOf',
                args: [BigInt(currParentId)],
              })) as bigint).toString()
            );
          } catch (e) {
            console.error('Finished checking parent chain');
            currParentId = 0;
          }
        }
        setParentChain(chain);

        // Fetch Siblings (shares same parent)
        if (parentId > 0) {
          const siblingIds: any = await publicClient.readContract({
            address: CARGO_REGISTRY_ADDRESS,
            abi: CARGO_REGISTRY_ABI,
            functionName: 'getChildTokens',
            args: [BigInt(parentId)],
          });
          const sibsList = [];
          for (const sId of siblingIds) {
            const idNum = Number(sId.toString());
            if (idNum !== activeTokenId) {
              const details = await fetchNodeDetails(idNum);
              sibsList.push(details);
            }
          }
          setSiblings(sibsList);
        } else {
          setSiblings([]);
        }

        // Fetch Direct Children of active token
        const childIds: any = await publicClient.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'getChildTokens',
          args: [BigInt(activeTokenId)],
        });

        const childrenList = [];
        for (const cId of childIds) {
          const details = await fetchNodeDetails(Number(cId.toString()));
          childrenList.push(details);
        }
        setChildChain(childrenList);
        setRootNode(activeDetails);

      } catch (err) {
        console.error('Error constructing lineage tree:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchNodeDetails(tokenId: number): Promise<LineageNode> {
      const details: any = await publicClient!.readContract({
        address: CARGO_REGISTRY_ADDRESS,
        abi: CARGO_REGISTRY_ABI,
        functionName: 'cargoBatches',
        args: [BigInt(tokenId)],
      });

      const pId = Number(
        ((await publicClient!.readContract({
          address: CARGO_REGISTRY_ADDRESS,
          abi: CARGO_REGISTRY_ABI,
          functionName: 'parentTokenOf',
          args: [BigInt(tokenId)],
        })) as bigint).toString()
      );

      const [,,, , , , , status, , , , weight] = details;

      return {
        id: tokenId,
        parentId: pId,
        weight: weight ? Number(weight.toString()) : 100,
        status,
        origin: details[1],
        isCurrent: tokenId === activeTokenId,
      };
    }

    loadTree();
  }, [publicClient, activeTokenId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-400 font-mono text-xs">
        <Layers className="w-4 h-4 animate-spin mr-2" />
        <span>Tracing crop lineage...</span>
      </div>
    );
  }

  // If this token is a root harvest node and has no kids, we don't need to show tree
  const hasLinage = parentChain.length > 0 || childChain.length > 0 || siblings.length > 0;
  if (!hasLinage) return null;

  return (
    <div className="p-6 bg-white border border-gray-150 rounded-3xl space-y-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Network className="w-5 h-5 text-gray-900" />
        <h4 className="text-sm font-bold text-gray-900">Crop Batch Lineage & Split flowchart</h4>
      </div>

      <div className="space-y-6 font-mono text-xs relative flex flex-col items-stretch">
        
        {/* 1. Parent Chain (Ancestors) */}
        {parentChain.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block self-start">Ancestral Roots</span>
            <div className="w-full flex flex-col items-center">
              {parentChain.map((node, index) => (
                <React.Fragment key={node.id}>
                  <div 
                    onClick={() => router.push(`/verify?tokenId=${node.id}`)}
                    className="w-full max-w-md flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 hover:border-cyan-300 rounded-2xl cursor-pointer transition-all duration-300 group shadow-sm"
                  >
                    <div className="p-1.5 bg-white border border-gray-100 rounded-lg">
                      <ArrowUp className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-600 transition-colors" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">Parent Harvest #{node.id}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{node.weight} units</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block truncate">{node.origin}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-600 transition-colors" />
                  </div>
                  
                  {/* Connector Line */}
                  <div className="w-[2px] h-6 border-l-2 border-dashed border-gray-300 relative my-0.5">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 rounded-full bg-cyan-500" />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 2. Current Active Token */}
        {rootNode && (
          <div className="flex flex-col items-center">
            {parentChain.length === 0 && (
              <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block self-start mb-2">Original Sourced Batch</span>
            )}
            <div className="w-full max-w-md p-4 bg-cyan-50/50 border-2 border-cyan-300 rounded-2xl flex items-center justify-between shadow-md relative ring-4 ring-cyan-100/40 animate-pulse">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-cyan-600 text-white rounded text-[9px] font-bold">
                    Currently Inspected
                  </span>
                  <span className="text-sm font-bold text-cyan-950">Batch #{rootNode.id}</span>
                </div>
                <span className="text-[10px] text-cyan-900/70 block truncate max-w-[240px]">{rootNode.origin}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-cyan-950 block">{rootNode.weight} units</span>
                <span className="text-[10px] text-cyan-600/80 font-bold block">{rootNode.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Siblings (Divisions from same Parent) */}
        {siblings.length > 0 && rootNode && (
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Sibling Split Batches (Same Parent)</span>
              <span className="text-[9px] text-gray-400">Total division flow</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {siblings.map((node) => {
                const parentWeightVal = parentChain.length > 0 ? parentChain[parentChain.length - 1].weight : rootNode.weight + siblings.reduce((acc, s) => acc + s.weight, 0);
                const percent = parentWeightVal > 0 ? Math.round((node.weight / parentWeightVal) * 100) : 0;
                return (
                  <div 
                    key={node.id}
                    onClick={() => router.push(`/verify?tokenId=${node.id}`)}
                    className="p-3 bg-white border border-gray-150 hover:border-cyan-300 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group shadow-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-gray-900 block">Batch #{node.id}</span>
                      <span className="text-[9px] text-gray-400 block truncate">{node.status}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-gray-900 block">{node.weight} units</span>
                      <span className="text-[9px] text-cyan-600 font-bold">{percent}% of parent</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Child Chain (Spawns / Retail Units) */}
        {childChain.length > 0 && rootNode && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex flex-col items-center">
              {/* Branching Connector Lines */}
              <div className="w-full max-w-md flex flex-col items-center">
                <div className="w-[2px] h-6 border-l-2 border-dashed border-gray-300 relative my-0.5">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 rounded-full bg-cyan-600" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block self-start">Child Packages & Split Divisions</span>
            </div>

            <div className="flex flex-col gap-3">
              {childChain.map((node) => {
                const percent = rootNode.weight > 0 ? Math.round((node.weight / rootNode.weight) * 100) : 0;
                return (
                  <div 
                    key={node.id}
                    onClick={() => router.push(`/verify?tokenId=${node.id}`)}
                    className="flex items-center gap-3 p-3 bg-emerald-50/20 border border-emerald-100 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all duration-300 group shadow-sm"
                  >
                    <div className="p-1.5 bg-white border border-emerald-100 rounded-lg">
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-gray-950">Child Token #{node.id}</span>
                        <div className="text-right">
                          <span className="text-xs text-emerald-700 font-bold block">{node.weight} units</span>
                          <span className="text-[9px] text-emerald-600 font-bold block">{percent}% of parent</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 block truncate">{node.status}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 transition-all" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

