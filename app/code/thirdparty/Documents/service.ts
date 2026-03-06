import { Service } from "@decorators/service";
import { ContentService } from "../content/service";
import { Documents } from "./entity";

@Service()
export class DocumentsService extends ContentService<Documents>
{
    protected getCollectionName(): string {
        return "documents"
    }
}
