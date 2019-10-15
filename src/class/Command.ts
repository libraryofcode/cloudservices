import { Message } from 'eris';
import Client from '../Client';

export default class Command {
    name: string

    description?: string

    usage?: string

    enabled: boolean

    aliases?: string[]

    client: Client
    permissions?: { roles?: string[], users?: string[] }
    guildOnly?: boolean
    public run (message: Message, args: string[]) {}
    constructor(client: Client) {
        this.name = 'None'
        this.description = 'No description given'
        this.usage = 'No usage given'
        this.enabled = false
        this.aliases = []
        this.guildOnly = true
        this.client = client
    }
}
