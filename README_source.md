# its2021z

Na zaliczenie: Zadania rozszerzające projekt

* (na 3) nowy widok dla nowej kolekcji tasks, "Zadania"; Zadanie jest wyposażone w przynależność do projektu, nazwę, datę końcową; na 3 nie trzeba kodować przynależności do projektu oraz dany inaczej niż jako niewalidowany łańcuch znaków; wszelkie usprawnienia w tym zakresie mogą podnieść ocenę końcową.

* (na 4) zadanie na 3 i dodatkowo: w kolekcji persons jest dodatkowe pole typu ObjectID albo łańcuch znaków, którego wartość identyfikuje projekt do którego przypisana jest osoba (jeden); w kolekcji tasks jest podobne pole które mówi o przynależności zadania do projektu; w widokach Osoby i Zadania umożliwić kontrolowane nadawanie wartości temu polu (kontrolowane = wybór jest ograniczony do aktualnych wartości z kolekcji projects); dopuszczam zrywanie więzów integralności w bazie (wiązania do projektów przez shortName a nie przez _id).

* (na 5) osoba może być przypisana do wielu projektów naraz; każde zadanie ma grupę osób realizujących a każdy projekt ma szefa (jedną z osób); zachowane są więzy integralności w bazie tj. wiązania są wykonywane przez klucze główne; proponowane rozwiązanie to nowa kolekcja, PersonsTasks złożona z _id, person_id i task_id oraz dodatkowe pole w kolekcji Projects, manager_id; frontend powinien umożliwić wszystkie typowe operacje na tych wiązaniach (dodanie/usunięcie osoby do zadania, ustawienie szefa projektu), przy czym nie ma obowiązku realizji tego na istniejących widokach).

Zadania dla studentów po kursie Programowanie Aplikacji Internetowych 

* import danych publicznych do lokalnej bazy danych

* generator danych przykładowych

* tutorial integracji OpenStreetMaps ze środowiskiem laboratoryjnym (np. przez https://www.npmjs.com/package/angular-osm)

* tutorial integracji OAuth ze środowiskiem laboratoryjnym

* zbiór obiektów na canvas, parametryzowalnych przez zmienne kontrolera
