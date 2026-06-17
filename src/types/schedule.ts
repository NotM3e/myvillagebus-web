// Ten plik jest deprecated - używaj @/types/database
// Zachowany dla kompatybilności wstecznej z dummy data

export interface Stop {
	name: string;
	time: string;
}

export interface Schedule {
	id: string;
	carrier: string;
	line: string;
	direction: string;
	days: string[];
	stops: Stop[];
}
