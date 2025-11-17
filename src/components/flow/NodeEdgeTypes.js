import BearingNode, { BearingNodeConfig, BearingNodeFieldConfig } from './nodes/Bearing';
import CouplingNode, { CouplingNodeConfig, CouplingNodeFieldConfig } from './nodes/Coupling';
import CompressorNode, { CompressorNodeConfig, CompressorNodeFieldConfig } from './nodes/Compressor';
import BoxNode, { BoxNodeConfig, BoxNodeFieldConfig } from './nodes/Box';
import { HeatExchangerNode, HeatExchangerNodeConfig, HeatExchangerNodeFieldConfig } from './nodes/HeatExchanger';
import { TurbineNode, TurbineNodeConfig, TurbineNodeFieldConfig } from './nodes/Turbine';
import { SurfaceCondenserNode, SurfaceCondenserNodeConfig, SurfaceCondenserNodeFieldConfig } from './nodes/SurfaceCondenser';
import { KODNode, KODNodeConfig, KODNodeFieldConfig } from './nodes/Kod';
import { CentrifugalPumpNode, CentrifugalPumpNodeConfig, CentrifugalPumpNodeFieldConfig } from './nodes/CentrifugalPump';
import { ESVNode, ESVNodeConfig, ESVNodeFieldConfig } from './nodes/Esv';
import { EjectorNode, EjectorNodeConfig, EjectorNodeFieldConfig } from './nodes/Ejector';
import { TextboxNode, TextBoxNodeConfig, TextBoxNodeFieldConfig } from './nodes/TextBox';
import { NDEJournalBearingNode, NDEJournalBearingNodeConfig, NDEJournalBearingNodeFieldConfig } from './nodes/NDEJournalBearing';
import { CompressorConfigNode, CompressorConfigNodeConfig, CompressorConfigNodeFieldConfig } from './nodes/CompressorConfig';
import { V2Node, V2NodeConfig, V2NodeFieldConfig } from './nodes/V2';
import FlowingPipeEdge from './edges/FlowingPipEdge';
import { Dot, DotConfig, DotFieldConfig } from './nodes/Dot';

export const nodeTypes = {
  bearingNode: BearingNode,
  couplingNode: CouplingNode,
  compressorNode: CompressorNode,
  compressorConfigNode: CompressorConfigNode,
  boxNode: BoxNode,
  heatExchangerNode: HeatExchangerNode,
  turbineNode: TurbineNode,
  surfaceCondenserNode: SurfaceCondenserNode,
  kodNode: KODNode,
  centrifugalPumpNode: CentrifugalPumpNode,
  esvNode: ESVNode,
  ejectorNode: EjectorNode,
  textBoxNode: TextboxNode,
  ndeJournalBearingNode: NDEJournalBearingNode,
  v2Node: V2Node,
  dotNode: Dot
};

export const edgeTypes = {
  flowingPipeStraightArrow: (props) => FlowingPipeEdge({ ...props, type: "straightArrow" }),
  flowingPipe: (props) => FlowingPipeEdge({ ...props, type: "straight" }),
  flowingPipeDotted: (props) => FlowingPipeEdge({ ...props, type: "dotted" }),
  flowingPipeDottedArrow: (props) => FlowingPipeEdge({ ...props, type: "dottedArrow" })
};

// Export all node configs as an array
export const allNodes = [
  BearingNodeConfig,
  CouplingNodeConfig,
  CompressorNodeConfig,
  CompressorConfigNodeConfig,
  BoxNodeConfig,
  HeatExchangerNodeConfig,
  TurbineNodeConfig,
  SurfaceCondenserNodeConfig,
  KODNodeConfig,
  CentrifugalPumpNodeConfig,
  ESVNodeConfig,
  EjectorNodeConfig,
  TextBoxNodeConfig,
  NDEJournalBearingNodeConfig,
  V2NodeConfig,
  DotConfig
];

// Export node types config for field configurations
export const nodeTypesConfig = {
  "bearing-node": BearingNodeFieldConfig,
  "coupling-node": CouplingNodeFieldConfig,
  "compressor-node": CompressorNodeFieldConfig,
  "compressor-config-node": CompressorConfigNodeFieldConfig,
  "box-node": BoxNodeFieldConfig,
  "heat-exchanger-node": HeatExchangerNodeFieldConfig,
  "turbine-node": TurbineNodeFieldConfig,
  "surface-condenser-node": SurfaceCondenserNodeFieldConfig,
  "kod-node": KODNodeFieldConfig,
  "centrifugal-pump-node": CentrifugalPumpNodeFieldConfig,
  "esv-node": ESVNodeFieldConfig,
  "ejector-node": EjectorNodeFieldConfig,
  "text-box-node": TextBoxNodeFieldConfig,
  "nde-journal-bearing-node": NDEJournalBearingNodeFieldConfig,
  "v2-node": V2NodeFieldConfig,
  "dot-node": DotFieldConfig || {}
};


