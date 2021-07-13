<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xs="http://www.w3.org/2001/XMLSchema"
                xmlns:array="http://www.w3.org/2005/xpath-functions/array"
                xmlns:map="http://www.w3.org/2005/xpath-functions/map"
                xmlns:ext="com.functions.ext"
                xmlns="http://www.w3.org/2005/xpath-functions"
                xmlns:ixsl="http://saxonica.com/ns/interactiveXSLT"
                exclude-result-prefixes="#all"
                expand-text="yes"
                version="3.0">
  
  <xsl:output method="text" indent="no"/>
  <xsl:mode on-no-match="shallow-copy"/>
  
  <xsl:param name="eval-result" as="item()*" select="()"/>
  <xsl:param name="expression" as="xs:string"/>
  <xsl:param name="sourceURI" as="xs:string?"/>
  <xsl:param name="this" as="item()"/>
  <xsl:variable name="xpathVariableNames" select="ixsl:get($this, 'keys')"/>
  <xsl:variable name="xpathVariableMap" as="map(*)">
    <xsl:map>
      <xsl:for-each select="$xpathVariableNames">
        <xsl:map-entry key="QName('', .)" select="ixsl:call($this, 'getVariable', [.])"/>
      </xsl:for-each>
    </xsl:map>
  </xsl:variable>
  
  <xsl:variable name="sourceDoc" as="document-node()?" select="if ($sourceURI and $sourceURI ne 'undefined') then doc($sourceURI) else ()"/>
  <xsl:variable name="contextNsDoc" as="element()" select="ext:createContextElement()"/>
  <xsl:variable name="xmlnsMap" as="map(*)?" 
    select="if ($sourceDoc) then ext:getURItoPrefixMap($sourceDoc/*) else ()"/>
  
  <xsl:variable name="nsContextElement" as="element()">
    <root xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
          xmlns:xs="http://www.w3.org/2001/XMLSchema"
          xmlns:array="http://www.w3.org/2005/xpath-functions/array"
          xmlns:map="http://www.w3.org/2005/xpath-functions/map"
          xmlns:math="http://www.w3.org/2005/xpath-functions/math"
      />
  </xsl:variable>
  
  <xsl:function name="ext:createContextElement" as="element()">
    <xsl:choose>
      <xsl:when test="$sourceDoc">
        <root>
          <xsl:sequence select="$sourceDoc/*/namespace-node()"/>
          <xsl:namespace name="array" select="'http://www.w3.org/2005/xpath-functions/array'"/>
          <xsl:namespace name="map" select="'http://www.w3.org/2005/xpath-functions/map'"/>
          <xsl:namespace name="math" select="'http://www.w3.org/2005/xpath-functions/math'"/>
          <xsl:namespace name="xs" select="'http://www.w3.org/2001/XMLSchema'"/>
        </root>
      </xsl:when>
      <xsl:otherwise>
        <xsl:sequence select="$nsContextElement"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <xsl:variable name="test1" select="map { 'values': ['uno', 'dos','tres', true(), (), 24] }"/>
  <xsl:variable name="test2" select="map {'abc': 'gloucester', 'def': (), 'deep': map { 'lvl2': 22 } }"/>
  <xsl:variable name="test3" select="[ 'spurs', 'bristol city', (), 'man united', array { 5,10,15 } ]"/>
  <xsl:variable name="test4" select="/*/*"/>
  <xsl:variable name="test5" select="map {'node': /*/*/@*}"/>
  <xsl:variable name="test6" as="xs:string" select="'base-uri(), array:size([1,2,3]), /books'"/>
  
  <xsl:template name="main">
    <xsl:variable name="result" as="item()*" select="ext:evaluate($sourceDoc, $expression)"/>
    <!-- <xsl:sequence select="ixsl:apply($set-fn, ['mytest', 'hello'])"/> -->
    <xsl:sequence select="ixsl:call($this, 'setVariable', ['myname', 'myvalue'])"/>
    <xsl:variable name="jsonXML" select="ext:convertArrayEntry($result)"/>
    <xsl:sequence select="xml-to-json($jsonXML)"/>
  </xsl:template>
  
  <xsl:template name="converted">
    <xsl:variable name="jsonXML" select="ext:convertArrayEntry($eval-result)"/>
    <xsl:sequence select="$jsonXML"/>
  </xsl:template>
  
  <xsl:template name="test">
    <xsl:variable name="result" as="item()*" select="ext:evaluate($sourceDoc, $test6)"/>
    <xsl:variable name="jsonXML" select="ext:convertArrayEntry($result)"/>
    <xsl:sequence select="xml-to-json($jsonXML)"/>
  </xsl:template>
  
  <xsl:function name="ext:evaluate" as="item()*">
    <xsl:param name="doc" as="node()?"/>
    <xsl:param name="xpathText" as="xs:string"/>
    <xsl:evaluate 
      xpath="$xpathText"
      context-item="$doc"
      namespace-context="$contextNsDoc"
      with-params="$xpathVariableMap"
      >
    </xsl:evaluate>
  </xsl:function>
  
  <xsl:function name="ext:getURItoPrefixMap" as="map(*)">
    <xsl:param name="source" as="node()"/>
    <xsl:sequence 
      select="
        map:merge(
          for $pfx in in-scope-prefixes($source),
            $ns in namespace-uri-for-prefix($pfx, $source)
          return 
            map:entry($ns, $pfx)
        )"/>
  </xsl:function>
  
  <xsl:variable name="regex" as="xs:string" select="'Q\{[^\{]*\}'"/>
  
  <xsl:function name="ext:tidyXPath" as="xs:string*">
    <xsl:param name="node" as="node()"/>
    <xsl:variable name="parts" as="xs:string*">
      <xsl:analyze-string select="path($node)" regex="{$regex}">
        <xsl:matching-substring>
          <xsl:variable name="uri" as="xs:string" select="substring(., 3, string-length(.) - 3)"/>
          <xsl:variable name="pfx" select="map:get($xmlnsMap, $uri)"/>
          <xsl:sequence select="if (string-length($pfx) eq 0) then '' else $pfx || ':'"/>
        </xsl:matching-substring>
        <xsl:non-matching-substring>
          <xsl:sequence select="."/>
        </xsl:non-matching-substring>
      </xsl:analyze-string>
    </xsl:variable>
    <xsl:sequence select="'&#x1680;' || string-join($parts)"/>
  </xsl:function>
  
  <xsl:function name="ext:convertMapEntry">
    <xsl:param name="key" as="xs:string?"/>
    <xsl:param name="value" as="item()*"/>
    
    <xsl:choose>
      <xsl:when test="count($value) gt 1">
        <array>
          <xsl:if test="$key">
            <xsl:attribute name="key" select="$key"/>
          </xsl:if>
          <xsl:for-each select="$value">
            <xsl:apply-templates select="."/>
          </xsl:for-each>
        </array>
      </xsl:when>
      <xsl:when test="exists($value)">
        <xsl:for-each select="$value">
          <xsl:apply-templates select=".">
            <xsl:with-param name="key" select="$key"/>
          </xsl:apply-templates>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <null key="{$key}"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <xsl:function name="ext:convertArrayEntry">
    <xsl:param name="value" as="item()*"/>
    <xsl:choose>
      <xsl:when test="count($value) gt 1">
        <array>
          <xsl:for-each select="$value">
            <xsl:apply-templates select="."/>
          </xsl:for-each>
        </array>
      </xsl:when>
      <xsl:when test="exists($value)">
        <xsl:for-each select="$value">
          <xsl:apply-templates select="."/>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <null/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <xsl:template match=".[
      . instance of node() 
      or . instance of text()
      or . instance of attribute()
      or . instance of processing-instruction()
      or . instance of comment()
    ]" mode="#default">
    <xsl:param name="key" as="xs:string?"/>
    <string>
      <xsl:if test="$key">
        <xsl:attribute name="key" select="$key"/>
      </xsl:if>
      <xsl:sequence select="ext:tidyXPath(.)"/>
    </string>
  </xsl:template>
  
  <xsl:template match=".[. instance of map(*)]" mode="#default">
    <xsl:param name="key" as="xs:string?"/>
    <map>
      <xsl:if test="$key">
        <xsl:attribute name="key" select="$key"/>
      </xsl:if>
      <xsl:sequence select="map:for-each(., ext:convertMapEntry#2)"/>
    </map>
  </xsl:template>
  
  <xsl:template match=".[. instance of array(*)]" mode="#default">
    <xsl:param name="key" as="xs:string?"/>
    <array>
      <xsl:if test="$key">
        <xsl:attribute name="key" select="$key"/>
      </xsl:if>
      <xsl:sequence select="array:for-each(., ext:convertArrayEntry#1)"/>
    </array>
  </xsl:template>
  
  <xsl:template match="." mode="#default">   
    <xsl:param name="key" as="xs:string?"/>
    
    <xsl:variable name="jsonTypeName" as="xs:string"
      select="
        if (. instance of xs:numeric)
          then 'number'
        else if (. instance of xs:boolean)
          then 'boolean'
        else 'string'
      "/>
    
    <xsl:element name="{$jsonTypeName}">
      <xsl:if test="$key">
        <xsl:attribute name="key" select="$key"/>
      </xsl:if>
      <xsl:value-of select="."/>
    </xsl:element>
    
  </xsl:template> 
  
</xsl:stylesheet>