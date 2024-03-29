module.exports = grammar({
  name: "alloy",

  rules: {
    alloyModule: ($) =>
      seq(optional($.moduleDecl), repeat($.import), repeat($.paragraph)),

    moduleDecl: ($) =>
      seq("module", $.qualName, optional(seq("[", repeat1($.name), "]"))),

    import: ($) =>
      seq(
        "open",
        $.qualName,
        optional(seq("[", repeat1($.qualName), "]")),
        optional(seq("as", $.name)),
      ),

    paragraph: ($) =>
      choice(
        $.sigDecl,
        $.factDecl,
        $.predDecl,
        $.funDecl,
        $.assertDecl,
        $.cmdDecl,
      ),

    // ... continue with the rest of your rules ...

    // ... continued from previous rules ...

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

    sigExt: ($) =>
      choice(
        seq("extends", $.qualName),
        seq("in", $.qualName, repeat(seq("+", $.qualName))),
      ),

    mult: ($) => choice("lone", "some", "one"),

    fieldDecl: ($) => seq(optional("var"), $.decl),

    decl: ($) =>
      seq(optional($.disj), repeat1($.name), ":", optional($.disj), $.expr),

    factDecl: ($) => seq("fact", optional($.name), $.block),

    predDecl: ($) =>
      seq(
        "pred",
        optional(seq($.qualName, ".")),
        $.name,
        optional($.paraDecls),
        $.block,
      ),

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

    paraDecls: ($) =>
      choice(seq("(", repeat($.decl), ")"), seq("[", repeat($.decl), "]")),

    assertDecl: ($) => seq("assert", optional($.name), $.block),

    cmdDecl: ($) =>
      seq(
        optional(seq($.name, ":")),
        choice("run", "check"),
        choice($.qualName, $.block),
        optional($.scope),
      ),

    // ... continue with the rest of your rules ...
    // ... continued from previous rules ...

    scope: ($) =>
      seq("for", choice($.number, seq("but", repeat1($.typescope)))),

    typescope: ($) => seq(optional("exactly"), $.number, $.qualName),

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

    const: ($) => seq(optional("-"), choice($.number, "none", "univ", "iden")),

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

    arrowOp: ($) =>
      seq(
        optional(choice($.mult, "set")),
        "->",
        optional(choice($.mult, "set")),
      ),

    compareOp: ($) => choice("in", "=", "<", ">", "=<", ">="),

    letDecl: ($) => seq($.name, "=", $.expr),

    block: ($) => seq("{", repeat($.expr), "}"),

    blockOrBar: ($) => choice($.block, seq($.bar, $.expr)),

    bar: ($) => "|",

    quant: ($) => choice("all", "no", "sum", $.mult),

    qualName: ($) =>
      seq(optional(seq("this/", repeat(seq($.name, "/")))), $.name),
  },
});
