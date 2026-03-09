import { prisma } from "@/lib/prisma";
import CopyButton from "@/components/CopyButton";
import {
  createCompetition,
  addPlayer,
  removePlayer,
  togglePayment,
} from "../../actions";

export default async function DashboardPage() {
  const competition = await prisma.competition.findFirst({
    include: {
      players: { orderBy: { createdAt: "asc" } },
      races: { orderBy: [{ day: "asc" }, { raceNumber: "asc" }] },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {!competition ? (
        <CreateCompetitionForm />
      ) : (
        <>
          <CompetitionDetails competition={competition} />
          <PlayersSection
            players={competition.players}
            competitionId={competition.id}
          />
        </>
      )}
    </div>
  );
}

function CreateCompetitionForm() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Create Competition
      </h2>
      <form action={createCompetition} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Competition Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Cheltenham 2026"
          />
        </div>
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Year
          </label>
          <input
            type="number"
            id="year"
            name="year"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 2026"
          />
        </div>
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date (Day 1 - Tuesday)
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Competition
        </button>
      </form>
    </div>
  );
}

function CompetitionDetails({
  competition,
}: {
  competition: {
    name: string;
    year: number;
    startDate: Date;
    races: { id: string }[];
    players: { id: string }[];
  };
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Competition Details
      </h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Name:</span>{" "}
          <span className="font-medium text-gray-800">{competition.name}</span>
        </div>
        <div>
          <span className="text-gray-500">Year:</span>{" "}
          <span className="font-medium text-gray-800">{competition.year}</span>
        </div>
        <div>
          <span className="text-gray-500">Start Date:</span>{" "}
          <span className="font-medium text-gray-800">
            {new Date(competition.startDate).toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Races:</span>{" "}
          <span className="font-medium text-gray-800">
            {competition.races.length}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Players:</span>{" "}
          <span className="font-medium text-gray-800">
            {competition.players.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlayersSection({
  players,
  competitionId,
}: {
  players: {
    id: string;
    name: string;
    token: string;
    paid: boolean;
  }[];
  competitionId: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Players</h2>

      {/* Add Player Form */}
      <form action={addPlayer} className="flex gap-3 mb-6">
        <input type="hidden" name="competitionId" value={competitionId} />
        <input
          type="text"
          name="name"
          required
          placeholder="Player name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          Add Player
        </button>
      </form>

      {/* Players List */}
      {players.length === 0 ? (
        <p className="text-gray-500 text-sm">No players yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-600">
                  Name
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">
                  Token Link
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-600">
                  Paid
                </th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 px-2 font-medium text-gray-800">
                    {player.name}
                  </td>
                  <td className="py-2 px-2">
                    <CopyableLink
                      url={`${baseUrl}/play/${player.token}`}
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <form action={togglePayment} className="inline">
                      <input
                        type="hidden"
                        name="playerId"
                        value={player.id}
                      />
                      <input
                        type="hidden"
                        name="currentPaid"
                        value={player.paid.toString()}
                      />
                      <button
                        type="submit"
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          player.paid
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {player.paid ? "Paid" : "Unpaid"}
                      </button>
                    </form>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <form action={removePlayer} className="inline">
                      <input
                        type="hidden"
                        name="playerId"
                        value={player.id}
                      />
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CopyableLink({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-xs">
        {url}
      </code>
      <CopyButton text={url} />
    </div>
  );
}
