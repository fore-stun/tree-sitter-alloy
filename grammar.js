module.exports = grammar({
  name: "alloy",

  rules: {
    // alloyModule ::= [moduleDecl] import* paragraph*
    alloyModule: ($) =>
      seq(optional($.moduleDecl), repeat($.import), repeat($.paragraph)),

    // moduleDecl ::= module qualName [[name,+]]
    // TODO check commas
    moduleDecl: ($) =>
      seq("module", $.qualName, optional(seq("[", repeat1($.name), "]"))),

    // import ::= open qualName [[qualName,+]] [as name]
    // TODO check commas
    import: ($) =>
      seq(
        "open",
        $.qualName,
        optional(seq("[", repeat1($.qualName), "]")),
        optional(seq("as", $.name)),
      ),

    // paragraph ::= sigDecl | factDecl | predDecl | funDecl
    //     | assertDecl | cmdDecl
    paragraph: ($) =>
      choice(
        $.sigDecl,
        $.factDecl,
        $.predDecl,
        $.funDecl,
        $.assertDecl,
        $.cmdDecl,
      ),

    // sigDecl ::= [var] [abstract] [mult] sig name,+ [sigExt] { fieldDecl,* } [block]
    // TODO check commas
    sigDecl: ($) =>
      seq(
        optional("var"),
        optional("abstract"),
        optional($.mult),
        "sig",
        repeat1($.name),
        optional($.sigExt),
        "{",
        repeat($.fieldDecl),
        "}",
        optional($.block),
      ),

    // sigExt ::= extends qualName | in qualName [+ qualName]*
    sigExt: ($) =>
      choice(
        seq("extends", $.qualName),
        seq("in", $.qualName, repeat(seq("+", $.qualName))),
      ),

    // mult ::= lone | some | one
    mult: ($) => choice("lone", "some", "one"),

    // fieldDecl ::= [var] decl
    fieldDecl: ($) => seq(optional("var"), $.decl),

    // decl ::= [disj] name,+ : [disj] expr
    decl: ($) =>
      seq(optional("disj"), repeat1($.name), ":", optional("disj"), $.expr),

    // factDecl ::= fact [name] block
    factDecl: ($) => seq("fact", optional($.name), $.block),

    // predDecl ::= pred [qualName .] name [paraDecls] block
    predDecl: ($) =>
      seq(
        "pred",
        optional(seq($.qualName, ".")),
        $.name,
        optional($.paraDecls),
        $.block,
      ),

    // funDecl ::= fun [qualName .] name [paraDecls] : expr { expr }
    funDecl: ($) =>
      seq(
        "fun",
        optional(seq($.qualName, ".")),
        $.name,
        optional($.paraDecls),
        ":",
        $.expr,
        "{",
        $.expr,
        "}",
      ),

    // paraDecls ::= ( decl,* ) | [ decl,* ]
    // TODO check commas
    paraDecls: ($) =>
      choice(seq("(", repeat($.decl), ")"), seq("[", repeat($.decl), "]")),

    // assertDecl ::= assert [name] block
    assertDecl: ($) => seq("assert", optional($.name), $.block),

    // cmdDecl ::= [name :] ( run | check ) ( qualName | block ) [scope]
    cmdDecl: ($) =>
      seq(
        optional(seq($.name, ":")),
        choice("run", "check"),
        choice($.qualName, $.block),
        optional($.scope),
      ),

    // scope ::= for number [but typescope,+] | for typescope,+
    // TODO check commas
    scope: ($) =>
      seq(
        "for",
        choice(
          seq($.number, optional(seq("but", repeat1($.typescope)))),
          repeat1($.typescope),
        ),
      ),

    // typescope ::= [exactly] number qualName
    typescope: ($) => seq(optional("exactly"), $.number, $.qualName),

    // expr ::= const | qualName | @name | this
    //     | unOp expr | expr binOp expr | expr arrowOp expr
    //     | expr [ expr,* ]
    //     | expr [! | not] compareOp expr
    //     | expr ( => | implies ) expr else expr
    //     | let letDecl,+ blockOrBar
    //     | quant decl,+ blockOrBar
    //     | { decl,+ blockOrBar }
    //     | expr '
    //     | ( expr ) | block
    // TODO check commas
    expr: ($) =>
      choice(
        $.const,
        $.qualName,
        seq("@", $.name),
        "this",
        seq($.unOp, $.expr),
        seq($.expr, $.binOp, $.expr),
        seq($.expr, $.arrowOp, $.expr),
        seq($.expr, "[", repeat($.expr), "]"),
        seq($.expr, choice("!", "not"), $.compareOp, $.expr),
        seq($.expr, choice("=>", "implies"), $.expr, "else", $.expr),
        seq("let", repeat1($.letDecl), $.blockOrBar),
        seq($.quant, repeat1($.decl), $.blockOrBar),
        seq("{", repeat1($.decl), $.blockOrBar, "}"),
        seq($.expr, "'"),
        seq("(", $.expr, ")"),
        $.block,
      ),

    // const ::= [-] number | none | univ | iden
    const: ($) => choice(seq(optional("-"), $.number), "none", "univ", "iden"),

    // unOp ::= ! | not | no | mult | set | # | ~ | * | ^
    //     | always | eventually | after | before | historically | once
    unOp: ($) =>
      choice(
        "!",
        "not",
        "no",
        $.mult,
        "set",
        "#",
        "~",
        "*",
        "^",
        "always",
        "eventually",
        "after",
        "before",
        "historically",
        "once",
      ),

    // binOp ::= || | or | && | and | <=> | iff | => | implies |
    //     & | + | - | ++ | <: | :> | . | until | releases | since | triggered | ;
    binOp: ($) =>
      choice(
        "||",
        "or",
        "&&",
        "and",
        "<=>",
        "iff",
        "=>",
        "implies",
        "&",
        "+",
        "-",
        "++",
        "<:",
        ":>",
        ".",
        "until",
        "releases",
        "since",
        "triggered",
        ";",
      ),

    // arrowOp ::= [mult | set] -> [mult | set]
    arrowOp: ($) =>
      seq(
        optional(choice($.mult, "set")),
        "->",
        optional(choice($.mult, "set")),
      ),

    // compareOp ::= in | = | < | > | =< | >=
    compareOp: ($) => choice("in", "=", "<", ">", "=<", ">="),

    // letDecl ::= name = expr
    letDecl: ($) => seq($.name, "=", $.expr),

    // block ::= { expr* }
    block: ($) => seq("{", repeat($.expr), "}"),

    // blockOrBar ::= block | bar expr
    blockOrBar: ($) => choice($.block, seq($.bar, $.expr)),

    // bar ::= |
    bar: ($) => "|",

    // quant ::= all | no | sum | mult
    quant: ($) => choice("all", "no", "sum", $.mult),

    // qualName ::= [this/] ( name / )* name
    qualName: ($) => seq(optional("this/"), repeat(seq($.name, "/")), $.name),

    name: (_$) => /[A-Za-z_"]+/,

    number: (_$) => /\d+/,
  },
});
