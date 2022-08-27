import { Uri } from "vscode";
import { VSCodeEvent } from "vscode-notebook-renderer/events";
import { ExtensionData } from "./extensionData";

export class HtmlTables {

    private static ampRegex = /&/g;
    private static ltRegex = /</g;
    private static xpathPrefix = ' ';
    private static targetURI: Uri | undefined;

    public static constructTableForObject(obj: any) {
        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                return this.constructTableForArray(obj);
            } else {
                return this.constructTableForTopObject(obj);
            }
        } else {
            return `<p>${this.escape(obj.toString())}</p>`
        }
    }

    private static constructTableForArray(array: Array<any>) {
        const tags: string[] = [];
        HtmlTables.targetURI = ExtensionData.lastEditorUri? Uri.parse(ExtensionData.lastEditorUri) : undefined;
        tags.push('<table><tbody>');
        array.forEach((item, index) => {
            if (index === 0 && typeof item === 'object' && !Array.isArray(item)) {
                tags.push('<thead><tr>');
                Object.keys(item).forEach(key => tags.push(`<th scope="column">${this.escape(key)}</th>`));
                tags.push('</tr></thead>');
            }
            tags.push('<tr>');
            if (Array.isArray(item)) {
                // array of arrays
                item.forEach((innerItem) => {
                    tags.push(`<td>${this.escape(innerItem)}</td>`);
                })
            } else if (typeof item === 'object') {
                // array of objects
                Object.values(item).forEach(value => tags.push(`<td>${this.escape(value)}</td>`));
            } else {
                tags.push(`<td>${this.escape(item)}</td>`);
            }
            tags.push('</tr>');
        });
        tags.push('</tbody></table>');
        return(tags.join(''));
    }


    private static constructTableForTopObject(obj: any) {
        const tags: string[] = [];
        tags.push('<table><tbody>');
        Object.entries(obj).forEach((item) => {
            const [key, value] = item;
            tags.push('<tr>');
            tags.push(`<th scope="row">${this.escape(key)}</th>`);
            if (Array.isArray(value)) {
                value.forEach((innerItem) => {
                    tags.push(`<td>${this.escape(innerItem)}</td>`);
                })
            } else {
                tags.push(`<td>${this.escape(value)}</td>`);
            }
            tags.push('</tr>');
        });
        tags.push('</tbody></table>');
        return(tags.join(''));
    }


    private static escape(obj: any) {
        if (typeof obj === 'string') {
            const str = <string>obj;
            if (HtmlTables.targetURI && str.startsWith(this.xpathPrefix)) {
                let nodePath = str.substring(1);
                const args = { xpath: nodePath, uri: HtmlTables.targetURI.toString() }
                const argsString = encodeURIComponent(JSON.stringify(args));
                const style = `text-decoration:none;`;
                return `<a style="${style}" href="command:xslt-xpath.selectXPathInDocument?${argsString}">${nodePath}</a>`
            } else {
                return obj.replace(this.ampRegex, '&amp;').replace(this.ltRegex, '&lt;');
            }
        } else {
            return JSON.stringify(obj).replace(this.ampRegex, '&amp;').replace(this.ltRegex, '&lt;');
        }
    }
}