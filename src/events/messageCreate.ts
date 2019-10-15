import Client from '../Client'
import { prefix } from '../config.json'
import { Message, TextChannel } from 'eris'
import Util from '../Util'
import Command from '../class/Command'

export default class {
    client: Client
    constructor (client: Client) {
        this.client = client
    }

    async run(message: Message) {
        const noPrefix: string[] = message.content.slice(prefix.length).trim().split(/ +/g)
        const command: string = noPrefix[0].toLowerCase()
        const resolved: Command = new Util().resolveCommand(this.client, command)
        if (!resolved) return
        if (resolved.guildOnly && !(message.channel instanceof TextChannel)) return
        const hasUserPerms: boolean = resolved.permissions.users.includes(message.author.id)
        let hasRolePerms: boolean = false
        for (const role of resolved.permissions.roles) {
            if (message.member && message.member.roles.includes(role)) {
                hasRolePerms = true; break
            }
        }
        if (!hasRolePerms && !hasUserPerms) return
        const args: string[] = noPrefix.slice(1)
        resolved.run(message, args)
    }
}