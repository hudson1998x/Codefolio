import { Container, OnInit } from "@decorators/di-container";
import { Service } from "@decorators/service";
import { AdminNavService } from "../adminnav";


@Service()
export class AdminDashboardService implements OnInit
{
    async onInit(): Promise<void> {
        const adminNavService: AdminNavService = Container.resolve(AdminNavService);

        await adminNavService.add({
            label: 'Dashboard',
            href: '/en-admin',
            key: 'dashboard',
            sortOrder: 0
        })
    }
    
}