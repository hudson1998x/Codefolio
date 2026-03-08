import { Service } from "@decorators/service";
import { HealthWarning } from "./types";



@Service()
export class WebsiteHealthService
{
    /**
     * Set a max log size.
     */
    private static maxLogSize: number = 200;

    /**
     * Holds the logs.
     */
    private _log: HealthWarning[] = [];

    /**
     * Add a health warning
     */
    public addHealthWarning(warning: HealthWarning)
    {
        if (WebsiteHealthService.maxLogSize <= this._log.length)
        {
            // shift the oldest out. 
            this._log.shift();
        }
        // append the newest. 
        this._log.push(warning);
    }
}