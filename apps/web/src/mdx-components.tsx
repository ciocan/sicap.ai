import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="font-semibold text-lg mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="font-semibold my-4">{children}</h2>,
    p: ({ children }) => <p className="mb-2">{children}</p>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    a: ({ children, ...rest }) => (
      <a className="font-semibold underline" target="_blank" {...rest}>
        {children}
      </a>
    ),
    ...components,
  };
}
