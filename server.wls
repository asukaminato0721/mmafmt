Print @ "Wolfram Expression Server 0.0.1 (alpha)";

Print @ "Usage: wolframserver.wls [port]\n";

Needs["CodeFormatter`"];

(* https://github.com/WolframResearch/codeformatter/issues/3 *)

CodeFormatter`$DefaultLineWidth = 120;

(* https://github.com/WolframResearch/codeformatter/issues/4#issuecomment-1297455149 *)

SetOptions[CodeFormatter`CodeFormatCST, CodeFormatter`Airiness -> -0.75, CodeFormatter`BreakLinesMethod -> "LineBreakerV2"];

If[Length[$ScriptCommandLine] == 2,
    port = ToExpression @ Part[$ScriptCommandLine, 2]
    ,
    port = 5858
];

Print["Port:       ", port];

Print["$ProcessID: ", $ProcessID];

ApacheDateString[] := With[{tz = StringReplace[DateString["ISOTimeZone"], ":" -> ""]},
    DateString[{"[", "Day", "/", "Month", "/", "Year", ":", "Hour", ":", "Minute", ":", "Second", " ", tz, "]"}]
];

ApacheLog[str_String] := Module[{},
    Print["127.0.0.1 - - " <> ApacheDateString[] <> " \"POST / HTTP/1.1\" 200 " <> StringTrim[str]]
];

listener = SocketListen[
    port
    ,
    Function[
        {assoc}
        ,
        With[
            {client = assoc["SourceSocket"], data = assoc["Data"]}
            ,
            request = ImportString[data, "HTTPRequest"];
            origin = Association[request["Headers"]]["origin"];
            If[Head[origin] === Missing,
                origin = ""
            ];
            result = CodeFormatter`CodeFormat[request["Body"]];
            response = ExportString[
                HTTPResponse[
                    result
                    ,
                    <|"StatusCode" -> 200, "ContentType" -> "application/json", "Headers" -> {"Access-Control-Allow-Origin" -> origin}|>
                ]
                ,
                "HTTPResponse"
            ];
            WriteString[client, response];
            ApacheLog[request["Body"]];
            Close[client]
        ]
    ]
];

url = URLBuild[
    <|
        "Scheme" -> "http"
        ,
        "Domain" -> First[listener["Socket"]["DestinationIPAddress"]]
        ,
        "Port" -> listener["Socket"]["DestinationPort"]
    |>
];

Print["Listening:  ", url, "\n"];

task = ZeroMQLink`Private`$AsyncState["Task"];

WaitAsynchronousTask[task];

Print["Exiting..."];