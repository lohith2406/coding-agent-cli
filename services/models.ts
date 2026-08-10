import axios from "axios";

type Model = {
    id: string;
}

type Provider = {
    id: string;
    models: Record<string, Model>;
}

type Models = Record<string, Provider>;

const MODELS_URL = "https://models.dev/api.json";

export async function getModels() {
    const response = await axios.get<Models>(MODELS_URL);
    return response.data;
}