module Main exposing (..)

import Browser
import Html exposing (Html, text, pre)
import Http
import Debug
import Html.Attributes exposing (..)
import Html.Events.Extra exposing (onChange)
import Html.Events exposing (onInput, onClick)
import Round
import Html.Parser
import Bootstrap.Navbar as Navbar
import Bootstrap.Grid as Grid
import Bootstrap.Grid.Row as Row
import Bootstrap.Grid.Col as Col
import Bootstrap.Card as Card
import Bootstrap.Card.Block as Block
import Bootstrap.Button as Button
import Bootstrap.ListGroup as Listgroup
import Bootstrap.Modal as Modal
import Bootstrap.Table as Table
import Array exposing (toList)


-- MAIN


main =
  Browser.element
    { init = init
    , update = update
    , subscriptions = subscriptions
    , view = view
    }



-- MODEL


type Model
  = Failure
  | Loading
  | Success String


init : () -> (Model, Cmd Msg)
init _ =
  ( Loading
  , Http.get
      { url = "https://raw.githubusercontent.com/dustywhite7/moneyball-webapp/master/data/playersheet2020.csv"
      , expect = Http.expectString GotText
      }
  )



-- UPDATE


type Msg
  = GotText (Result Http.Error String)


update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    GotText result ->
      case result of
        Ok fullText ->
          (Success fullText, Cmd.none)

        Err _ ->
          (Failure, Cmd.none)



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
  Sub.none



-- VIEW


view : Model -> Html Msg
view model =
  case model of
    Failure ->
      text "I was unable to load your data."

    Loading ->
      text "Loading..."

    Success fullText ->
      Grid.row [ Row.centerXs ]
        [ Grid.col [ Col.xs2 ]
            [ Table.table
      { options = [ Table.striped, Table.hover ]
      , thead =  Table.simpleThead
          [ Table.th [] [ text "Player Number" ]
          , Table.th [] [ text "First Name" ]
          , Table.th [] [ text "Last Name" ]
          , Table.th [] [ text "Position" ]
          , Table.th [] [ text "On-Base Percentage" ]
          , Table.th [] [ text "Slugging Average" ]
          , Table.th [] [ text "Index Value" ]
          , Table.th [] [ text "Selected?" ]
          , Table.th [] [ text "Salary" ]
          ]
      , tbody =
          Table.tbody [] ( makeTable ( processCsv fullText ) )
      } ]
        , Grid.col [ Col.xs4 ]
            [ text "Col 2" ]
        ]

processCsv : String -> List ( List String )
processCsv text =
     text
     |> String.split "\n"
     |> List.map (String.split ",")
     |> List.filter (\x -> x /= [""])
     |> List.filter (\x -> x /= ["number","first","last","position","ops","slg","index","selected","salary"])

makeTable : List (List String) -> List (Table.Row msg)
makeTable csv =
      csv
      |> List.map makeRow

makeRow : List String -> Table.Row msg
makeRow row =
      Table.tr [] ( listCell row )

listCell : List String -> List (Table.Cell msg)
listCell row =
      row
      |> List.map makeCell

makeCell : String -> Table.Cell msg
makeCell cell = 
      Table.td [] [ text cell ]