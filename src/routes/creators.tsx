import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";

// ─── Fake data ────────────────────────────────────────────────────────────

interface Creator {
	id: string;
	username: string;
	displayName: string;
	bookmarkCount: number;
}

function generateCreators(count: number): Creator[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `creator-${i}`,
		username: `user_${i}`,
		displayName: `Creator ${i}`,
		bookmarkCount: Math.floor(Math.random() * 100),
	}));
}

const creatorsQueryOptions = () =>
	queryOptions({
		queryKey: ["creators"],
		queryFn: async () => {
			// Simulate network delay
			await new Promise((r) => setTimeout(r, 2000));
			return generateCreators(1000);
		},
	});

// ─── Route ────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/creators")({
	loader: ({ context }) => {
		context.queryClient.prefetchQuery(creatorsQueryOptions());
	},
	component: CreatorsPage,
});

// ─── Responsive columns ──────────────────────────────────────────────────

const BREAKPOINTS = [
	{ minWidth: 1024, cols: 3 },
	{ minWidth: 640, cols: 2 },
	{ minWidth: 0, cols: 1 },
] as const;

function getColumns(width: number): number {
	for (const bp of BREAKPOINTS) {
		if (width >= bp.minWidth) return bp.cols;
	}
	return 1;
}

function useContainerWidth(ref: React.RefObject<HTMLElement | null>): number {
	const [width, setWidth] = useState(() => ref.current?.offsetWidth ?? 0);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		setWidth(el.offsetWidth);
		const observer = new ResizeObserver(([entry]) => {
			setWidth(entry.contentRect.width);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref]);

	return width;
}

function chunkIntoRows<T>(items: T[], cols: number): T[][] {
	const rows: T[][] = [];
	for (let i = 0; i < items.length; i += cols) {
		rows.push(items.slice(i, i + cols));
	}
	return rows;
}

// ─── Skeletons ───────────────────────────────────────────────────────────

function CreatorCardSkeleton() {
	return (
		<div className="flex h-[66px] items-center gap-3 rounded-lg border border-gray-200 p-3">
			<div className="h-8 w-8 rounded-full bg-gray-200" />
			<div className="flex-1 space-y-1.5">
				<div className="h-3.5 w-28 rounded bg-gray-200" />
				<div className="h-3 w-16 rounded bg-gray-200" />
			</div>
			<div className="h-7 w-12 rounded-lg bg-gray-200" />
		</div>
	);
}

function CreatorsLoading() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 24 }, (_, i) => (
				<CreatorCardSkeleton key={i} />
			))}
		</div>
	);
}

// ─── Creator Card ────────────────────────────────────────────────────────

function CreatorCard({ creator }: { creator: Creator }) {
	return (
		<div className="flex h-[66px] items-center gap-3 rounded-lg border border-gray-200 p-3">
			<img
				alt={creator.displayName}
				className="h-8 w-8 rounded-full object-cover"
				src={`https://i.pravatar.cc/64?u=${creator.id}`}
			/>
			<div className="flex-1">
				<div className="text-sm font-medium">{creator.displayName}</div>
				<div className="text-xs text-gray-500">@{creator.username}</div>
			</div>
			<div className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium">
				{creator.bookmarkCount}
			</div>
		</div>
	);
}

// ─── Virtualized Grid ────────────────────────────────────────────────────

const ROW_HEIGHT = 66;
const ROW_GAP = 16;
const COL_GAP = 16;

function VirtualCreatorGrid({
	creators,
	scrollRef,
}: {
	creators: Creator[];
	scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const width = useContainerWidth(containerRef);
	const cols = getColumns(width);

	const rows = useMemo(() => chunkIntoRows(creators, cols), [creators, cols]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		estimateSize: () => ROW_HEIGHT,
		gap: ROW_GAP,
		getScrollElement: () => scrollRef.current,
		overscan: 10,
	});

	return (
		<div ref={containerRef}>
			<div
				className="relative w-full"
				style={{ height: virtualizer.getTotalSize() }}
			>
				{virtualizer.getVirtualItems().map((virtualRow) => (
					<div
						data-index={virtualRow.index}
						key={virtualRow.key}
						ref={virtualizer.measureElement}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						<div
							className="grid"
							style={{
								gap: COL_GAP,
								gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
							}}
						>
							{rows[virtualRow.index].map((creator) => (
								<CreatorCard key={creator.id} creator={creator} />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────

function CreatorsPage() {
	const scrollRef = useRef<HTMLDivElement>(null);

	return (
		<main className="flex h-screen flex-col">
			<div className="flex h-[54px] shrink-0 items-center border-b px-4">
				<h1 className="text-lg font-bold">Creators</h1>
			</div>
			<div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
				<Suspense fallback={<CreatorsLoading />}>
					<CreatorsContent scrollRef={scrollRef} />
				</Suspense>
			</div>
		</main>
	);
}

function CreatorsContent({
	scrollRef,
}: {
	scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
	const { data: creators } = useSuspenseQuery(creatorsQueryOptions());

	return <VirtualCreatorGrid creators={creators} scrollRef={scrollRef} />;
}
