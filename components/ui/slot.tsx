import * as React from "react";

/**
 * Minimal `asChild` Slot — merges its props/ref onto a single child element,
 * so we can render e.g. <Button asChild><Link/></Button> without Radix.
 */
export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) return null;
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ...props,
      ...child.props,
      ref,
      className: [props.className, child.props.className]
        .filter(Boolean)
        .join(" "),
    });
  },
);
Slot.displayName = "Slot";
