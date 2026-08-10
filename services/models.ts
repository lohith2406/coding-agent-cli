import axios from "axios";

type Model = {
    id: string;
}

type Provider = {
    id: string;
    name: string
    models: Record<string, Model>;
}

export type Catalog = Record<string, Provider>;

const CATALOG_URL = "https://models.dev/api.json";

export async function getCatalog() {
    const response = await axios.get<Catalog>(CATALOG_URL);
    return response.data;
}