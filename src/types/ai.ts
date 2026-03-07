export interface AIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    extractedFields?: ExtractedField[];
    isLoading?: boolean;
}

export interface ExtractedField {
    key: string;
    label: string;
    value: string | number | boolean;
    confidence: number;
    source: 'ai_extracted' | 'user_confirmed' | 'default';
}

export interface AIModelConfig {
    id: string;
    name: string;
    baseUrl: string;
    models: string[];
    priority: number;
    enabled: boolean;
    apiKey?: string;
}

export interface StorageConfig {
    type: 'cloudflare_r2' | 'baidu_netdisk';
    endpointUrl: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicDomain?: string;
    enabled: boolean;
}

export interface ConsultState {
    phase: 'greeting' | 'collecting' | 'confirming' | 'completed';
    collectedFields: Record<string, any>;
    missingFields: string[];
    askCount: number;
    maxAskCount: number;
}
