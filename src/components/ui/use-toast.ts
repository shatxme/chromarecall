import { toast as sonnerToast, ToastT } from 'sonner'

type ToastOptions = Partial<ToastT> & {
  variant?: 'default' | 'destructive'
}

export const toast = ({ variant, ...props }: ToastOptions) => {
  sonnerToast(props.title || '', {
    ...props,
    className: variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : undefined
  })
}