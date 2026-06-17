import { Schedule } from "@/types/schedule";

export const dummySchedules: Schedule[] = [
	{
		id: "1",
		carrier: "PKS Grudziądz",
		line: "Mątawy",
		direction: "Nowe → Grudziądz",
		days: ["Pon", "Wt", "Śr", "Czw", "Pt"],
		stops: [
			{ name: "Nowe - ul. Dworcowa", time: "06:35" },
			{ name: "Kończyce", time: "06:39" },
			{ name: "Tryl I NŻ", time: "06:41" },
		],
	},
	{
		id: "2",
		carrier: "PKS Grudziądz",
		line: "Komursk",
		direction: "Nowe → Grudziądz",
		days: ["Pon", "Wt", "Śr", "Czw", "Pt"],
		stops: [
			{ name: "Nowe - ul. Dworcowa", time: "06:30" },
			{ name: "Kończyce", time: "06:33" },
			{ name: "Morgi", time: "06:34" },
		],
	},
	{
		id: "3",
		carrier: "Żana",
		line: "A",
		direction: "Nowe → Grudziądz",
		days: ["Pon", "Wt", "Śr", "Czw", "Pt"],
		stops: [
			{ name: "Nowe - ul. Dworcowa", time: "06:35" },
			{ name: "Morgi", time: "06:40" },
			{ name: "warlubie", time: "06:48" },
		],
	},
];
