/**
 * 深拷贝
 * @param { string } data 需要深拷贝的数据
 * @returns 深拷贝的数据
 */
export function deepClone(data: any) {
    let stack = [];
    let cloned;
    if (Array.isArray(data)) {
        cloned = [];
    } else if (typeof data === "object" && data !== null) {
        cloned = {};
    } else {
        return data;
    }
    stack.push({
        original: data,
        copy: cloned
    });
    while (stack.length > 0) {
        let current: any = stack.pop();
        let original = current.original;
        let copy = current.copy;

        for (let key in original) {
            if (original.hasOwnProperty(key)) {
                let value = original[key];

                if (typeof value === "object" && value !== null) {
                    copy[key] = Array.isArray(value) ? [] : {};

                    stack.push({
                        original: value,
                        copy: copy[key]
                    });
                } else {
                    copy[key] = value;
                }
            }
        }
    }
    return cloned;
}


/**
 * 数组扁平化-多维转一维
 * @param { array } tree 多维数组
 * @param { string } tree 转一维的条件，例如 "children"
 * @returns 一维数组
 */
export const arrayFlattened = (tree: any, term: string) => {
    const result = [];
    const stack = [...tree.reverse()];

    while (stack.length) {
        const node = stack.pop();
        result.push(node);

        if (Array.isArray(node[term])) {
            for (let i = 0; i < node[term].length; i++) {
                stack.push(node[term][i]);
            }
        }
    }
    return result;
};

/**
 * 根据指定id递归树查到指定节点
 * @param {Array[Object]} tree 树形结构
 * @param {string | number} key 指定key
 * @param {string | number} keyValue key绑定的vaue
 * @returns {Object | null} 返回查找到的节点，未找到则返回null
 */
export const findCategoryById = (tree: any, key: string, keyValue: any) => {
    const stack = [...tree].reverse(); // 初始节点逆序入栈

    while (stack.length > 0) {
        const node = stack.pop();
        if (node[key] === keyValue) return node;

        if (node.children?.length) {
            // 子节点逆序入栈（保持原顺序遍历）
            for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push(node.children[i]);
            }
        }
    }

    return null;
};

/**
 * 树状结构中查找并返回指定名称的节点的所有父节点
 * @param tree - 要搜索的树状结构。
 * @param key - 指定匹配的key
 * @param keyValue - 要查找的目标节点key值。
 * @description 函数接受一棵树、指定的key、目标节点key值
 * @description 如果在树中找到目标节点，函数将返回包含从根节点到目标节点的所有父节点的数组
 * @description 如果树中不存在目标节点，则返回 null。
 * @returns 包含目标节点的所有父节点的数组，如果没有找到则返回 null。
 */
export const findPathOfParentNode = (tree: any[], key: string, keyValue: string | number): any[] | null => {
    // 用于构建链表结构的路径节点
    class PathNode {
        constructor(
            public node: any,
            public parent: PathNode | null
        ) {}
    }

    // 用栈代替递归（每个元素包含节点和父路径节点）
    const stack: { node: any; parentPath: PathNode | null }[] = [];

    // 初始化栈（倒序压入以保持左子树优先）
    for (let i = tree.length - 1; i >= 0; i--) {
        stack.push({ node: tree[i], parentPath: null });
    }

    while (stack.length > 0) {
        const { node, parentPath } = stack.pop()!;
        const currentPath = new PathNode(node, parentPath);

        // 找到目标：将链表转为数组
        if (node[key] === keyValue) {
            const pathArray: any[] = [];
            let pointer: PathNode | null = currentPath;
            while (pointer !== null) {
                pathArray.unshift(pointer.node); // 反向插入生成正向路径
                pointer = pointer.parent;
            }
            return pathArray;
        }

        // 处理子节点（倒序压入保证左子树优先）
        if (node.children) {
            for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push({
                    node: node.children[i],
                    parentPath: currentPath // 传递路径链表
                });
            }
        }
    }
    return null;
};
