import { HttpClient } from "../api/HttpClient";

// Use Vite's import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:3000';

export async function addFlowDiagram(flowData){
    try{
        const url = `${API_BASE_URL}/flow-diagrams`;
        const body = {
            nodeJson: flowData.nodeJson,
            edgeJson: flowData.edgeJson,
            saved: flowData.saved,
            caseID: flowData.caseID,
            active: flowData.active,
            createdOn: flowData.createdOn,
            createdBy: flowData.createdBy
        }
        return await HttpClient.post(url, body);
    }catch(error){
        console.error('Error saving flow diagram:', error);
        throw error;
    }
}

export async function getFlowDiagram(caseId = 1){
    try{
        const url = `${API_BASE_URL}/flow-diagrams/${caseId}`;
        return await HttpClient.get(url);
    }catch(error){
        console.error('Error fetching flow diagram:', error);
        throw error;
    }
}

export async function updateFlowDiagram(caseId, flowData){
    try{
        const url = `${API_BASE_URL}/flow-diagrams/${caseId}`;
        const body = {
            nodeJson: flowData.nodeJson,
            edgeJson: flowData.edgeJson,
            saved: flowData.saved !== undefined ? flowData.saved : true,
            modifiedOn: flowData.modifiedOn || new Date().toISOString()
        }
        return await HttpClient.put(url, body);
    }catch(error){
        console.error('Error updating flow diagram:', error);
        throw error;
    }
}

export async function deleteFlowDiagram(diagramId){
    try{
        const url = `${API_BASE_URL}/flow-diagrams/${diagramId}`;
        return await HttpClient.delete(url);
    }catch(error){
        console.error('Error deleting flow diagram:', error);
        throw error;
    }
}