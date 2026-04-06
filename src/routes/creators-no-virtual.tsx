import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

// ─── Fake data ────────────────────────────────────────────────────────────

interface Creator {
	id: string;
	username: string;
	displayName: string;
	bookmarkCount: number;
}

async function generateCreators(count: number): Promise<Creator[]> {
	await new Promise((r) => setTimeout(r, 100));
	return Array.from({ length: count }, (_, i) => ({
		id: `creator-${i}`,
		username: `user_${i}`,
		displayName: `Creator ${i}`,
		bookmarkCount: Math.floor(Math.random() * 100),
	}));
}

const creatorsQueryOptions = () =>
	queryOptions({
		queryKey: ["creators-no-virtual"],
		queryFn: () => generateCreators(1000),
	});

// ─── Route ────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/creators-no-virtual")({
	loader: ({ context }) => {
		context.queryClient.prefetchQuery(creatorsQueryOptions());
	},
	component: CreatorsPage,
});

// ─── Skeletons ────────────────────────────────────────────────────────────

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

// ─── Creator Card ─────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────

function CreatorsPage() {
	return (
		<main className="flex h-screen flex-col">
			<div className="flex h-[54px] shrink-0 items-center border-b px-4">
				<h1 className="text-lg font-bold">Creators (No Virtualisation)</h1>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				<Suspense fallback={<CreatorsLoading />}>
					<CreatorsContent />
				</Suspense>
			</div>
		</main>
	);
}

function CreatorsContent() {
	const { data: creators } = useSuspenseQuery(creatorsQueryOptions());

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{creators.map((creator) => (
				<CreatorCard key={creator.id} creator={creator} />
			))}
		</div>
	);
}
