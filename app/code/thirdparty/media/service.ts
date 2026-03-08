import { Container, OnInit } from "@decorators/di-container";
import { Service } from "@decorators/service";
import { AdminNavService } from "../adminnav";

@Service()
export class MediaService implements OnInit
{
    async onInit(): Promise<void> {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);

        adminNavService.add({
            label: 'Media',
            href: '/en-admin/media/all',
            key: 'media'
        })
    }
    
}