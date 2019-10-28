/* eslint-disable no-param-reassign */

export default class RichEmbed {
  title?: string

  type?: string

  description?: string

  url?: string

  timestamp?: Date

  color?: number

  footer?: { text: string, icon_url?: string, proxy_icon_url?: string}

  image?: { url?: string, proxy_url?: string, height?: number, width?: number }

  thumbnail?: { url?: string, proxy_url?: string, height?: number, width?: number }

  video?: { url?: string, height?: number, width?: number }

  provider?: { name?: string, url?: string}

  author?: { name?: string, url?: string, proxy_icon_url?: string, icon_url?: string}

  fields?: {name: string, value: string, inline?: boolean}[]

  constructor(data: {
    title?: string, type?: string, description?: string, url?: string, timestamp?: Date, color?: number, fields?: {name: string, value: string, inline?: boolean}[]
    footer?: { text: string, icon_url?: string, proxy_icon_url?: string}, image?: { url?: string, proxy_url?: string, height?: number, width?: number },
    thumbnail?: { url?: string, proxy_url?: string, height?: number, width?: number }, video?: { url?: string, height?: number, width?: number },
    provider?: { name?: string, url?: string}, author?: { name?: string, url?: string, proxy_icon_url?: string, icon_url?: string},
  } = {}) {
    /*
    let types: {
      title?: string, type?: string, description?: string, url?: string, timestamp?: Date, color?: number, fields?: {name: string, value: string, inline?: boolean}[]
      footer?: { text: string, icon_url?: string, proxy_icon_url?: string}, image?: { url?: string, proxy_url?: string, height?: number, width?: number },
      thumbnail?: { url?: string, proxy_url?: string, height?: number, width?: number }, video?: { url?: string, height?: number, width?: number },
      provider?: { name?: string, url?: string}, author?: { name?: string, url?: string, proxy_icon_url?: string, icon_url?: string}
    };
    */
    this.title = data.title;
    this.description = data.description;
    this.url = data.url;
    this.color = data.color;
    this.author = data.author;
    this.timestamp = data.timestamp;
    this.fields = data.fields || [];
    this.thumbnail = data.thumbnail;
    this.image = data.image;
    this.footer = data.footer;
  }

  /**
   * Sets the title of this embed.
   */
  setTitle(title: string) {
    if (typeof title !== 'string') throw new TypeError('RichEmbed titles must be a string.');
    if (title.length > 256) throw new RangeError('RichEmbed titles may not exceed 256 characters.');
    this.title = title;
    return this;
  }

  /**
   * Sets the description of this embed.
   */
  setDescription(description: string) {
    if (typeof description !== 'string') throw new TypeError('RichEmbed descriptions must be a string.');
    if (description.length > 2048) throw new RangeError('RichEmbed descriptions may not exceed 2048 characters.');
    this.description = description;
    return this;
  }

  /**
   * Sets the URL of this embed.
   */
  setURL(url: string) {
    if (typeof url !== 'string') throw new TypeError('RichEmbed URLs must be a string.');
    if (!url.startsWith('http://') || !url.startsWith('https://')) url = `https://${url}`;
    this.url = url;
    return this;
  }

  /**
   * Sets the color of this embed.
   */
  setColor(color: string | number) {
    if (typeof color === 'string' || typeof color === 'number') {
      if (typeof color === 'string') {
        const regex = /[^a-f0-9]/gi;
        color = color.replace(/#/g, '');
        if (regex.test(color)) throw new RangeError('Hexadecimal colours must not contain characters other than 0-9 and a-f.');
        color = parseInt(color, 16);
      } else if (color < 0 || color > 16777215) throw new RangeError('Base 10 colours must not be less than 0 or greater than 16777215.');
      this.color = color;
      return this;
    }
    throw new TypeError('RichEmbed colours must be hexadecimal as string or number.');
  }

  /**
   * Sets the author of this embed.
   */
  setAuthor(name: string, icon_url?: string, url?: string) {
    if (typeof name !== 'string') throw new TypeError('RichEmbed Author names must be a string.');
    if (url && typeof url !== 'string') throw new TypeError('RichEmbed Author URLs must be a string.');
    if (icon_url && typeof icon_url !== 'string') throw new TypeError('RichEmbed Author icons must be a string.');
    this.author = { name, icon_url, url };
    return this;
  }

  /**
   * Sets the timestamp of this embed.
   */
  setTimestamp(timestamp = new Date()) {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(timestamp.getTime())) throw new TypeError('Expecting ISO8601 (Date constructor)');
    this.timestamp = timestamp;
    return this;
  }

  /**
   * Adds a field to the embed (max 25).
   */
  addField(name: string, value: string, inline = false) {
    if (typeof name !== 'string') throw new TypeError('RichEmbed Field names must be a string.');
    if (typeof value !== 'string') throw new TypeError('RichEmbed Field values must be a string.');
    if (typeof inline !== 'boolean') throw new TypeError('RichEmbed Field inlines must be a boolean.');
    if (this.fields.length >= 25) throw new RangeError('RichEmbeds may not exceed 25 fields.');
    if (name.length > 256) throw new RangeError('RichEmbed field names may not exceed 256 characters.');
    if (!/\S/.test(name)) throw new RangeError('RichEmbed field names may not be empty.');
    if (value.length > 1024) throw new RangeError('RichEmbed field values may not exceed 1024 characters.');
    if (!/\S/.test(value)) throw new RangeError('RichEmbed field values may not be empty.');
    this.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Convenience function for `<RichEmbed>.addField('\u200B', '\u200B', inline)`.
   */
  addBlankField(inline = false) {
    return this.addField('\u200B', '\u200B', inline);
  }

  /**
   * Set the thumbnail of this embed.
   */
  setThumbnail(url: string) {
    if (typeof url !== 'string') throw new TypeError('RichEmbed Thumbnail URLs must be a string.');
    if (!url.startsWith('http://') || !url.startsWith('https://')) url = `https://${url}`;
    this.thumbnail = { url };
    return this;
  }

  /**
   * Set the image of this embed.
   */
  setImage(url: string) {
    if (typeof url !== 'string') throw new TypeError('RichEmbed Image URLs must be a string.');
    if (!url.startsWith('http://') || !url.startsWith('https://')) url = `https://${url}`;
    this.image = { url };
    return this;
  }

  /**
   * Sets the footer of this embed.
   */
  setFooter(text: string, icon_url?: string) {
    if (typeof text !== 'string') throw new TypeError('RichEmbed Footers must be a string.');
    if (icon_url && typeof icon_url !== 'string') throw new TypeError('RichEmbed Footer icon URLs must be a string.');
    if (!icon_url.startsWith('http://') || !icon_url.startsWith('https://')) icon_url = `https://${icon_url}`;
    if (text.length > 2048) throw new RangeError('RichEmbed footer text may not exceed 2048 characters.');
    this.footer = { text, icon_url };
    return this;
  }
}
