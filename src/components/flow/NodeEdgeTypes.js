
import {CouplingNode, CouplingNodeConfig, CouplingNodeFieldConfig } from './nodes/Coupling';
import {CompressorNode, CompressorNodeConfig, CompressorNodeFieldConfig } from './nodes/Compressor';
import {BoxNode, BoxNodeConfig, BoxNodeFieldConfig } from './nodes/Box';
import { HeatExchangerNode, HeatExchangerNodeConfig, HeatExchangerNodeFieldConfig } from './nodes/HeatExchanger';
import { TurbineNode, TurbineNodeConfig, TurbineNodeFieldConfig } from './nodes/Turbine';
import { SurfaceCondenserNode, SurfaceCondenserNodeConfig, SurfaceCondenserNodeFieldConfig } from './nodes/SurfaceCondenser';
import { CentrifugalPumpNode, CentrifugalPumpNodeConfig, CentrifugalPumpNodeFieldConfig } from './nodes/CentrifugalPump';
import { EsvNode, EsvNodeConfig, EsvNodeFieldConfig } from './nodes/Esv';
import { EjectorNode, EjectorNodeConfig, EjectorNodeFieldConfig } from './nodes/Ejector';
import { TextboxNode, TextBoxNodeConfig, TextBoxNodeFieldConfig } from './nodes/TextBox';
import { NdeJournalBearingNode, NdeJournalBearingNodeConfig, NdeJournalBearingNodeFieldConfig } from './nodes/NdeJournalBearing';
import { CompressorConfigNode, CompressorConfigNodeConfig, CompressorConfigNodeFieldConfig } from './nodes/CompressorConfig';
import { Dot, DotConfig, DotFieldConfig } from './nodes/Dot';
import { KodNode, KodNodeConfig, KodNodeFieldConfig } from './nodes/Kod';
import FlowingPipeEdge from './edges/FlowingPipEdge';

export const nodeTypes = {
  couplingNode: CouplingNode,
  compressorNode: CompressorNode,
  compressorConfigNode: CompressorConfigNode,
  boxNode: BoxNode,
  heatExchangerNode: HeatExchangerNode,
  turbineNode: TurbineNode,
  surfaceCondenserNode: SurfaceCondenserNode,
  kodNode: KodNode,
  centrifugalPumpNode: CentrifugalPumpNode,
  esvNode: EsvNode,
  ejectorNode: EjectorNode,
  ndeJournalBearingNode: NdeJournalBearingNode,
  dotNode: Dot,
  textBoxNode: TextboxNode,
};

// Export all node configs as an array
export const allNodes = [
  CouplingNodeConfig,
  CompressorNodeConfig,
  CompressorConfigNodeConfig,
  BoxNodeConfig,
  HeatExchangerNodeConfig,
  TurbineNodeConfig,
  SurfaceCondenserNodeConfig,
  KodNodeConfig,
  CentrifugalPumpNodeConfig,
  EsvNodeConfig,
  EjectorNodeConfig,
  NdeJournalBearingNodeConfig,
  DotConfig,
  TextBoxNodeConfig,
];

// Export node types config for field configurations
export const nodeTypesConfig = {
  "coupling-node": CouplingNodeFieldConfig,
  "compressor-node": CompressorNodeFieldConfig,
  "compressor-config-node": CompressorConfigNodeFieldConfig,
  "box-node": BoxNodeFieldConfig,
  "heat-exchanger-node": HeatExchangerNodeFieldConfig,
  "turbine-node": TurbineNodeFieldConfig,
  "surface-condenser-node": SurfaceCondenserNodeFieldConfig,
  "kod-node": KodNodeFieldConfig,
  "centrifugal-pump-node": CentrifugalPumpNodeFieldConfig,
  "esv-node": EsvNodeFieldConfig,
  "ejector-node": EjectorNodeFieldConfig,
  "nde-journal-bearing-node": NdeJournalBearingNodeFieldConfig,
  "dot-node": DotFieldConfig || {},
  "text-box-node": TextBoxNodeFieldConfig,
};


export const edgeTypes = {
  flowingPipeStraightArrow: (props) => FlowingPipeEdge({ ...props, type: "straightArrow" }),
  flowingPipe: (props) => FlowingPipeEdge({ ...props, type: "straight" }),
  flowingPipeDotted: (props) => FlowingPipeEdge({ ...props, type: "dotted" }),
  flowingPipeDottedArrow: (props) => FlowingPipeEdge({ ...props, type: "dottedArrow" })
};
