module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow calling pure functions without using their return value',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          pureMethods: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unusedPureCall: "Pure method '{{method}}' called without using return value. Did you mean to assign the result?",
    },
  },

  create(context) {
    // Default pure methods that don't mutate the original object/array
    const defaultPureMethods = [
      // Array methods that return new arrays
      'concat',
      'slice',
      'map',
      'filter',
      'reduce',
      'reduceRight',
      'find',
      'findIndex',
      'some',
      'every',
      'includes',
      'indexOf',
      'lastIndexOf',
      'join',
      'toString',
      'toLocaleString',
      'flatMap',
      'flat',
      'with',
      'toReversed',
      'toSorted',
      'toSpliced',

      // String methods that return new strings
      'substring',
      'substr',
      'toLowerCase',
      'toUpperCase',
      'trim',
      'trimStart',
      'trimEnd',
      'replace',
      'replaceAll',
      'split',
      'padStart',
      'padEnd',
      'repeat',
      'charAt',
      'charCodeAt',
      'slice',
      'substr',
      'substring',

      // Object methods that return new objects/values
      'assign',
      'keys',
      'values',
      'entries',
      'freeze',
      'seal',
      'getOwnPropertyNames',
      'getOwnPropertyDescriptors',
      'sign',
    ]

    const options = context.options[0] || {}
    const pureMethods = [...defaultPureMethods, ...(options.pureMethods || [])]

    function isPureMethodCall(node) {
      if (node.type !== 'CallExpression') return false
      if (node.callee.type !== 'MemberExpression') return false
      if (node.callee.property.type !== 'Identifier') return false

      return pureMethods.includes(node.callee.property.name)
    }

    function isResultUsed(node) {
      const parent = node.parent

      // Check if return value is used in meaningful way
      switch (parent.type) {
        case 'AssignmentExpression':
          return parent.right === node
        case 'VariableDeclarator':
          return parent.init === node
        case 'ReturnStatement':
          return true
        case 'CallExpression':
          return parent.arguments.includes(node)
        case 'BinaryExpression':
        case 'LogicalExpression':
        case 'UnaryExpression':
          return true
        case 'ConditionalExpression':
          return parent.test === node || parent.consequent === node || parent.alternate === node
        case 'ArrayExpression':
          return parent.elements.includes(node)
        case 'ObjectExpression':
          return parent.properties.some((prop) => prop.value === node)
        case 'Property':
          return parent.value === node
        case 'IfStatement':
          return parent.test === node
        case 'WhileStatement':
        case 'ForStatement':
          return parent.test === node
        case 'ExpressionStatement':
          return false // This is the problem case - standalone expression
        case 'AwaitExpression':
          return parent.argument === node
        default:
          return true // Assume used in other contexts
      }
    }

    return {
      ExpressionStatement(node) {
        const expression = node.expression

        if (isPureMethodCall(expression) && !isResultUsed(expression)) {
          const methodName = expression.callee.property.name

          context.report({
            node: expression,
            messageId: 'unusedPureCall',
            data: {
              method: methodName,
            },
            suggest: [
              {
                desc: 'Assign result to variable',
                fix(fixer) {
                  const sourceCode = context.getSourceCode()
                  const objectText = sourceCode.getText(expression.callee.object)
                  const methodCall = sourceCode.getText(expression)

                  // Suggest assignment back to the same variable if possible
                  if (expression.callee.object.type === 'Identifier') {
                    return fixer.replaceText(node, `${objectText} = ${methodCall};`)
                  } else {
                    return fixer.replaceText(node, `const result = ${methodCall};`)
                  }
                },
              },
            ],
          })
        }
      },
    }
  },
}
