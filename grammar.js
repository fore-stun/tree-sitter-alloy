const commaSepBy1 = (i) => seq(i, repeat(seq(",", i)));

const commaSepBy = (i) => optional(commaSepBy1(i));

module.exports = grammar({
  name: "alloy",

  word: ($) => $.name,

  precedences: () => [
    [
      // Expression operators bind most tightly, in the following precedence order, tightest first:

      // unary operators: ~, ^ and *;
      "unary_operators",
      // prime: ';
      "prime",
      // dot join: . ;
      "dot_join",
      // box join: [];
      // Note, in particular, that dot join binds more tightly than box join, so a.b[c] is parsed as (a.b)[c].
      "box_join",
      // restriction operators: <: and :>;
      "restriction_operators",
      // arrow product: ->;
      "arrow_product",
      // intersection: &;
      "intersection",
      // override: ++;
      "override",
      // cardinality: #;
      "cardinality",
      // union and difference: + and -;
      "union_and_difference",
      // expression quantifiers and multiplicities: no, some, lone, one, set;
      "expression_quantifiers_and_multiplicities",
      // comparison negation operators: ! and not;
      "comparison_negation_operators",
      // comparison operators: in, =, <, >, = [sic], =<, >=.
      "comparison_operators",

      // Logical operators are bound at lower precedence, as follows:

      // unary operators: ! and not, always, eventually, after, before, historically and once;
      "unary_logical_operators",
      // binary temporal connectives: until, releases, since, triggered;
      "binary_temporal_connectives",
      // conjunction: && and and;
      "conjunction",
      // implication: =>, implies, and else;
      "implication",
      // bi-implication: <=>, iff;
      "bi_implication",
      // disjunction: || and or;
      "disjunction",
      // let and quantification operators: let, no, some, lone, one and sum [all?];
      "let_and_quantification_operators",
      // sequence (of states): ;.
      "sequence_of_states",
    ],
  ],

  rules: {
    // alloyModule ::= [moduleDecl] import* paragraph*
    alloyModule: ($) =>
      seq(optional($.moduleDecl), repeat($.import), repeat($.paragraph)),

    // moduleDecl ::= module qualName [[name,+]]
    moduleDecl: ($) =>
      seq("module", $.qualName, optional(seq("[", commaSepBy1($.name), "]"))),

    // import ::= open qualName [[qualName,+]] [as name]
    import: ($) =>
      seq(
        "open",
        $.qualName,
        optional(seq("[", commaSepBy1($.qualName), "]")),
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
    sigDecl: ($) =>
      seq(
        optional("var"),
        optional("abstract"),
        optional($.mult),
        "sig",
        commaSepBy1($.name),
        optional($.sigExt),
        "{",
        commaSepBy($.fieldDecl),
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
    mult: (_$) =>
      prec("let_and_quantification_operators", choice("lone", "some", "one")),

    // fieldDecl ::= [var] decl
    fieldDecl: ($) => seq(optional("var"), $.decl),

    // decl ::= [disj] name,+ : [disj] expr
    decl: ($) =>
      seq(optional("disj"), commaSepBy1($.name), ":", optional("disj"), $.expr),

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
    paraDecls: ($) =>
      choice(
        seq("(", commaSepBy($.decl), ")"),
        seq("[", commaSepBy($.decl), "]"),
      ),

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
    scope: ($) =>
      seq(
        "for",
        choice(
          seq($.number, optional(seq("but", commaSepBy1($.typescope)))),
          commaSepBy1($.typescope),
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
    expr: ($) =>
      choice(
        $.const,
        $.qualName,
        seq("@", $.name),
        "this",
        seq($.unOp, $.expr),
        seq($.expr, $.binOp, $.expr),
        seq($.expr, $.arrowOp, $.expr),
        seq($.expr, "[", prec("box_join", commaSepBy($.expr)), "]"),

        seq(
          $.expr,
          prec(
            "comparison_operators",
            seq(
              prec("comparison_negation_operators", choice("!", "not")),
              $.compareOp,
            ),
          ),
          $.expr,
        ),

        seq(
          $.expr,
          prec.right("implication", choice("=>", "implies")),
          $.expr,
          prec.right("implication", "else"),
          $.expr,
        ),
        seq(
          "let",
          prec("let_and_quantification_operators", commaSepBy1($.letDecl)),
          $.blockOrBar,
        ),
        seq(
          $.quant,
          prec("let_and_quantification_operators", commaSepBy1($.decl)),
          $.blockOrBar,
        ),
        seq("{", commaSepBy1($.decl), $.blockOrBar, "}"),
        seq($.expr, prec("prime", "'")),
        seq("(", $.expr, ")"),
        $.block,
      ),

    // const ::= [-] number | none | univ | iden
    const: ($) => choice(seq(optional("-"), $.number), "none", "univ", "iden"),

    // unOp ::= ! | not | no | mult | set | # | ~ | * | ^
    //     | always | eventually | after | before | historically | once
    unOp: ($) =>
      choice($.unExpOp, $.unExpQuantMult, $.unCardinality, $.unLogicalOp),

    // "unary_operators"
    unExpOp: (_$) => prec("unary_operators", choice("~", "*", "^")),
    // "cardinality"
    unCardinality: (_$) => prec("cardinality", "#"),
    // "expression_quantifiers_and_multiplicities"
    unExpQuantMult: ($) =>
      prec(
        "expression_quantifiers_and_multiplicities",
        choice("no", $.mult, "set"),
      ),
    // "unary_logical_operators"
    unLogicalOp: (_$) =>
      prec(
        "unary_logical_operators",
        choice(
          "!",
          "not",
          "always",
          "eventually",
          "after",
          "before",
          "historically",
          "once",
        ),
      ),

    // binOp ::= || | or | && | and | <=> | iff | => | implies |
    //     & | + | - | ++ | <: | :> | . | until | releases | since | triggered | ;
    binOp: ($) =>
      choice(
        $.binDotJoin,
        $.binRestriction,
        $.binIntersection,
        $.binOverride,
        $.binUnionDiff,
        $.binBinTempConn,
        $.binConjunction,
        $.binImplication,
        $.binBiImplication,
        $.binDisjunction,
        $.binSequenceStates,
      ),

    // Expression
    // "dot_join"
    binDotJoin: (_$) => prec.left("dot_join", "."),
    // "restriction_operators"
    binRestriction: (_$) =>
      prec.left("restriction_operators", choice("<:", ":>")),
    // "intersection"
    binIntersection: (_$) => prec.left("intersection", "&"),
    // "override"
    binOverride: (_$) => prec.left("override", "++"),
    // "union_and_difference"
    binUnionDiff: (_$) => prec.left("union_and_difference", choice("+", "-")),

    // Logical
    // "binary_temporal_connectives"
    binBinTempConn: (_$) =>
      prec.left(
        "binary_temporal_connectives",
        choice("until", "releases", "since", "triggered"),
      ),
    // "conjunction"
    binConjunction: (_$) => prec.left("conjunction", choice("&&", "and")),
    // "implication"
    binImplication: (_$) => prec.right("implication", choice("=>", "implies")),
    // "bi_implication"
    binBiImplication: (_$) => prec.left("bi_implication", choice("<=>", "iff")),
    // "disjunction"
    binDisjunction: (_$) => prec.left("disjunction", choice("||", "or")),
    // "sequence_of_states"
    binSequenceStates: (_$) => prec.right("sequence_of_states", ";"),

    // arrowOp ::= [mult | set] -> [mult | set]
    arrowOp: ($) =>
      prec.left(
        "arrow_product",
        seq(
          optional(
            prec("let_and_quantification_operators", choice($.mult, "set")),
          ),
          "->",
          optional(
            prec("let_and_quantification_operators", choice($.mult, "set")),
          ),
        ),
      ),

    // compareOp ::= in | = | < | > | =< | >=
    compareOp: (_$) => choice("in", "=", "<", ">", "=<", ">="),

    // letDecl ::= name = expr
    letDecl: ($) => seq($.name, "=", $.expr),

    // block ::= { expr* }
    block: ($) => seq("{", repeat($.expr), "}"),

    // blockOrBar ::= block | bar expr
    blockOrBar: ($) => choice($.block, seq($.bar, $.expr)),

    // bar ::= |
    bar: (_$) => "|",

    // quant ::= all | no | sum | mult
    quant: ($) =>
      prec(
        "let_and_quantification_operators",
        choice("all", "no", "sum", $.mult),
      ),

    // qualName ::= [this/] ( name / )* name
    qualName: ($) => seq(optional("this/"), repeat(seq($.name, "/")), $.name),

    name: (_$) => /[A-Za-z_"]+/,

    number: (_$) => /\d+/,
  },
});
