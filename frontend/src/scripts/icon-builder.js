import fs from 'fs';
import path from 'path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { svgPathBbox } from 'svg-path-bbox';
import parse from 'parse-svg-path';
import abs from 'abs-svg-path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.join(__dirname, '../assets/icons');

const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'));

// Function to convert complex shapes into path data
function convertToPathData(node) {
    const type = node.nodeName.toLowerCase();
    
    if (type === 'rect') {
        const x = parseFloat(node.getAttribute('x') || 0);
        const y = parseFloat(node.getAttribute('y') || 0);
        const w = parseFloat(node.getAttribute('width') || 0);
        const h = parseFloat(node.getAttribute('height') || 0);
        return `M${x},${y} h${w} v${h} h-${w} Z`;
    }
    
    if (type === 'circle') {
        const cx = parseFloat(node.getAttribute('cx') || 0);
        const cy = parseFloat(node.getAttribute('cy') || 0);
        const r = parseFloat(node.getAttribute('r') || 0);
        return `M${cx-r},${cy} a${r},${r} 0 1,0 ${r*2},0 a${r},${r} 0 1,0 -${r*2},0`;
    }

    if (type === 'polygon' || type === 'polyline') {
        const points = node.getAttribute('points');
        if (!points) return null;
        const coords = points.trim().split(/[\s,]+/).map(parseFloat);
        if (coords.length < 2) return null;
        
        let d = `M${coords[0]},${coords[1]}`;
        for (let i = 2; i < coords.length; i += 2) {
            d += ` L${coords[i]},${coords[i+1]}`;
        }
        if (type === 'polygon') d += ' Z';
        return d;
    }
    
    return null;
}

files.forEach(filename => {
    const filePath = path.join(iconsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const doc = new DOMParser().parseFromString(content, 'text/xml');
    const svgNode = doc.getElementsByTagName('svg')[0];
    
    if (!svgNode) return;

    // We collect all shapes to calculate the bounding box
    const shapes = Array.from(doc.getElementsByTagName('path'))
        .concat(Array.from(doc.getElementsByTagName('polygon')))
        .concat(Array.from(doc.getElementsByTagName('polyline')))
        .concat(Array.from(doc.getElementsByTagName('rect')))
        .concat(Array.from(doc.getElementsByTagName('circle')))
        .concat(Array.from(doc.getElementsByTagName('ellipse')));
        
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    shapes.forEach(node => {
        let d = node.getAttribute('d');
        
        // If it's a basic shape, convert it to path data to compute bounds
        if (node.nodeName.toLowerCase() !== 'path') {
            d = convertToPathData(node);
        }
        
        if (d) {
            try {
                // Ensure absolute paths
                const absolutePath = abs(parse(d));
                // Convert back to string for svgPathBbox
                const absolutePathString = absolutePath.map(cmd => cmd.join(' ')).join(' ');
                
                const [x0, y0, x1, y1] = svgPathBbox(absolutePathString);
                
                if (x0 < minX) minX = x0;
                if (y0 < minY) minY = y0;
                if (x1 > maxX) maxX = x1;
                if (y1 > maxY) maxY = y1;
            } catch (e) {
                console.warn(`Could not parse path in ${filename}:`, e);
            }
        }
    });

    if (minX === Infinity) return;

    // Pad slightly (1% of width)
    const width = maxX - minX;
    const height = maxY - minY;
    const padding = width * 0.02;
    
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const viewBox = `${minX.toFixed(2)} ${minY.toFixed(2)} ${(maxX - minX).toFixed(2)} ${(maxY - minY).toFixed(2)}`;

    // Just update the viewBox! No color tampering.
    svgNode.setAttribute('viewBox', viewBox);
    
    // Also remove fixed width and height so it scales responsively
    svgNode.removeAttribute('width');
    svgNode.removeAttribute('height');

    const serializer = new XMLSerializer();
    const newSvgString = serializer.serializeToString(doc);

    // Write back to the SAME file
    fs.writeFileSync(filePath, newSvgString);
    console.log(`Optimized ${filename} (viewBox: ${viewBox})`);
});
