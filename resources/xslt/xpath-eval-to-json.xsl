<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xs="http://www.w3.org/2001/XMLSchema"
                xmlns:array="http://www.w3.org/2005/xpath-functions/array"
                xmlns:map="http://www.w3.org/2005/xpath-functions/map"
                xmlns:ext="com.functions.ext"
                xmlns="http://www.w3.org/2005/xpath-functions"
                exclude-result-prefixes="#all"
                expand-text="yes"
                version="3.0">
  
  <xsl:output method="text" indent="yes"/>
  <xsl:mode on-no-match="shallow-copy"/>
  
  <xsl:param name="eval-result" as="item()*" select="()"/>
  <xsl:param name="expression" as="xs:string"/>
  <xsl:param name="sourceURI" as="xs:string?"/>
  <xsl:variable name="sourceDoc" as="node()?" select="if ($sourceURI) then doc($sourceURI) else ()"/>
  
  <xsl:variable name="test1" select="map { 'values': ['uno', 'dos','tres', true(), (), 24] }"/>
  <xsl:variable name="test2" select="map {'abc': 'gloucester', 'def': (), 'deep': map { 'lvl2': 22 } }"/>
  <xsl:variable name="test3" select="[ 'spurs', 'bristol city', (), 'man united', array { 5,10,15 } ]"/>
  <xsl:variable name="test4" select="/*/*"/>
  
  <xsl:template name="main">
    <xsl:variable name="result" as="item()*" select="ext:evaluate($sourceDoc)"/>
    <xsl:variable name="jsonXML" select="ext:convertArrayEntry($result)"/>
    <xsl:sequence select="xml-to-json($jsonXML)"/>
  </xsl:template>
  
  <xsl:template name="converted">
    <xsl:variable name="jsonXML" select="ext:convertArrayEntry($eval-result)"/>
    <xsl:sequence select="$jsonXML"/>
  </xsl:template>
  
  <xsl:template name="test">
    <xsl:variable name="jsonXML" select="ext:convertArrayEntry($test1)"/>
    <xsl:sequence select="xml-to-json($jsonXML)"/>
  </xsl:template>
  
  <xsl:function name="ext:evaluate" as="item()*">
    <xsl:param name="doc" as="node()?"/>
    <xsl:choose>
      <xsl:when test="$doc">
        <xsl:evaluate 
          xpath="$expression"
          context-item="$doc"
          namespace-context="$doc"
          >
          
        </xsl:evaluate>
      </xsl:when>
      <xsl:otherwise>
        <xsl:evaluate 
          xpath="$expression"
          context-item="$doc"
          >
          
        </xsl:evaluate>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <xsl:function name="ext:convertMapEntry">
    <xsl:param name="key" as="xs:string?"/>
    <xsl:param name="value" as="item()*"/>
    
    <xsl:choose>
      <xsl:when test="count($value) gt 1">
        <array>
          <xsl:for-each select="$value">
            <xsl:apply-templates select=".">
              <xsl:with-param name="key" select="$key"/>
            </xsl:apply-templates>
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
    <xsl:message expand-text="yes">
      ==== Watch Variables ====
      value:     {$value}
    </xsl:message>
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
  
  <xsl:template match=".[. instance of node()]" mode="#default">
    <xsl:param name="key" as="xs:string?"/>
    <string>
      <xsl:if test="$key">
        <xsl:attribute name="key" select="$key"/>
      </xsl:if>
      <xsl:sequence select="path()"/>
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