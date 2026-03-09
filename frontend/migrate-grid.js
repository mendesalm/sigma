module.exports = function (fileInfo, api, options) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    let hasModifications = false;

    root.find(j.JSXElement, {
        openingElement: {
            name: { name: "Grid" }
        }
    }).forEach(path => {
        let hasItem = false;
        let sizeProps = {};
        let propsToRemove = [];

        const attrs = path.node.openingElement.attributes || [];

        attrs.forEach((attr, index) => {
            if (attr.type === "JSXAttribute" && attr.name) {
                const name = attr.name.name;
                if (name === "item") {
                    hasItem = true;
                    propsToRemove.push(index);
                } else if (["xs", "sm", "md", "lg", "xl"].includes(name)) {
                    if (attr.value === null) {
                        sizeProps[name] = j.booleanLiteral(true);
                    } else if (attr.value.type === "JSXExpressionContainer") {
                        sizeProps[name] = attr.value.expression;
                    } else {
                        sizeProps[name] = attr.value;
                    }
                    propsToRemove.push(index);
                }
            }
        });

        if (hasItem || Object.keys(sizeProps).length > 0) {
            hasModifications = true;
            propsToRemove.sort((a, b) => b - a).forEach(idx => {
                attrs.splice(idx, 1);
            });

            if (Object.keys(sizeProps).length > 0) {
                const sizeObj = j.objectExpression(
                    Object.keys(sizeProps).map(k => j.objectProperty(j.identifier(k), sizeProps[k]))
                );
                attrs.push(j.jsxAttribute(j.jsxIdentifier("size"), j.jsxExpressionContainer(sizeObj)));
            }
        }
    });

    return hasModifications ? root.toSource() : null;
};
