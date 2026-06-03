import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComponentProps, HTMLAttributes } from 'react';

const normalizeMarkdownLinks = (text: string) =>
  text.replace(/\[([\s\S]*?)\]\((https?:\/\/[^)\s]+)\)/g, (_match, rawLabel: string, rawUrl: string) => {
    const tokens = rawLabel.trim().split(/\s+/).filter(Boolean);
    const normalizedLabel = tokens.length > 1 && tokens.every((token) => token.length <= 2)
      ? tokens.join('')
      : rawLabel.replace(/\s+/g, ' ').trim();

    const normalizedUrl = rawUrl.replace(/\s+/g, '');
    return `[${normalizedLabel}](${normalizedUrl})`;
  });

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-end justify-end gap-2 py-4',
      from === 'user' ? 'is-user' : 'is-assistant flex-row-reverse justify-end',
      '[&>div]:max-w-[80%]',
      className,
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      'text-secondary-foreground flex flex-col gap-2 overflow-hidden rounded-3xl px-4 py-3 text-sm tracking-normal antialiased',
      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground group-[.is-user]:rounded-tr-none',
      'group-[.is-assistant]:rounded-bl-none group-[.is-assistant]:bg-gray-200 group-[.is-assistant]:text-gray-800',
      className,
    )}
    {...props}
  >
    <div className="markdown-content whitespace-normal break-words">
      {typeof children === 'string' ? (
        (() => {
          const normalizedContent = normalizeMarkdownLinks(children);

          return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 hover:decoration-primary/80"
              >
                {children}
              </a>
            ),
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            h1: ({ children }) => <h1 className="mb-2 mt-3 text-lg font-semibold first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h3>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>,
            blockquote: ({ children }) => <blockquote className="my-2 border-l-4 border-border pl-4 italic">{children}</blockquote>,
          }}
        >
          {normalizedContent}
        </ReactMarkdown>
          );
        })()
      ) : (
        children
      )}
    </div>
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar className={cn('ring-border size-8 ring', className)} {...props}>
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || 'ME'}</AvatarFallback>
  </Avatar>
);
