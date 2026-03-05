import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Prefab } from "./entity";

@Service()
export class PrefabService extends ContentService<Prefab>
{
    protected getCollectionName(): string {
        return "prefab"
    }
}
